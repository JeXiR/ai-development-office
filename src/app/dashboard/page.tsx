import {OfficeDashboard} from "@/components/OfficeDashboard";
import {readRequestLanguage} from "@/i18n/read-request-language";

export default async function DashboardPage() {
  return <OfficeDashboard initialLanguage={await readRequestLanguage()} />;
}
