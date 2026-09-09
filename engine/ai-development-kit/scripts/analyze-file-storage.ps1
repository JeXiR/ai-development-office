param([Parameter(Mandatory=$true)][string]$ProjectPath)

$signals = [ordered]@{
    laravel_disks = $false
    s3 = $false
    upload_code = @()
    image_tools = @()
}

if (Test-Path (Join-Path $ProjectPath "config\filesystems.php")) {
    $signals.laravel_disks = $true
    $text = Get-Content (Join-Path $ProjectPath "config\filesystems.php") -Raw
    if ($text -match '(?i)s3|AWS_BUCKET|AWS_ACCESS_KEY') { $signals.s3 = $true }
}

$packagePath = Join-Path $ProjectPath "package.json"
if (Test-Path $packagePath) {
    $pkg = Get-Content $packagePath -Raw | ConvertFrom-Json
    $deps = @{}
    if ($pkg.dependencies) { $pkg.dependencies.psobject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
    foreach ($name in @("sharp","jimp","@aws-sdk/client-s3","multer")) {
        if ($deps.ContainsKey($name)) { $signals.image_tools += $name }
    }
}

Get-ChildItem $ProjectPath -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch '\\node_modules\\|\\vendor\\|\\.git\\|\\storage\\' -and
        $_.Extension -in @(".php",".ts",".tsx",".js")
    } | ForEach-Object {
        try {
            $t = Get-Content $_.FullName -Raw
            if ($t -match '(?i)upload|storeAs|putFile|Storage::|multipart|FormData') {
                $signals.upload_code += $_.FullName.Substring($ProjectPath.Length).TrimStart('\')
            }
        } catch {}
    }

$aiDir = Join-Path $ProjectPath ".ai-kit"
New-Item -ItemType Directory -Force -Path $aiDir | Out-Null

@{
    generated_at = (Get-Date).ToString("o")
    signals = $signals
} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $aiDir "file-storage-profile.json") -Encoding UTF8

Write-Host "Laravel filesystem config: $($signals.laravel_disks)"
Write-Host "S3 signal: $($signals.s3)"
Write-Host "Upload-related files: $($signals.upload_code.Count)"
