import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function QueuePage({ params }: { params: { id: string } }) {
  redirect(`/project/${params.id}`);
}
