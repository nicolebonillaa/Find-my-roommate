import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function StudentProfile() {
  const { id } = useParams();
  return <PageHeader title="Student profile" subtitle={`Viewing: ${id}`} />;
}