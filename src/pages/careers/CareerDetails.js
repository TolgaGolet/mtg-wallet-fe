import { useParams, useLoaderData } from "react-router-dom";

export default function CareerDetails() {
  const { id } = useParams();
  const careerDetails = useLoaderData();

  return (
    <div className="career-details">
      <h2>{id}</h2>
      <p>title: {careerDetails.title}</p>
      <p>description {careerDetails.description}</p>
    </div>
  );
}

// data loader
export const careerDetailsLoader = async ({ params }) => {
  const { id } = params;
  const res = await fetch("https://dummyjson.com/products/" + id);
  if (!res.ok) {
    throw Error("Could not find the product");
  }
  return res.json();
};
