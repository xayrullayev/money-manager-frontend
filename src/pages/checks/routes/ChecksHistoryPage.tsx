import { useNavigate } from "react-router-dom";
import { CheckHistoryScreen } from "../history";

/** `/checks` — cheklar tarixi ro'yxati. Chek tanlanganda tafsilot sahifasiga o'tadi. */
export function ChecksHistoryPage() {
  const navigate = useNavigate();
  return <CheckHistoryScreen onSelectCheck={(id) => navigate(`/checks/${id}`)} />;
}
