import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function WriteReview() {
  const { connectionId } = useParams();
  return <PageHeader title="Write a review" subtitle={`Connection: ${connectionId}`} />;
}