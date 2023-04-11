import { useLoaderData, Link } from "react-router-dom";

export default function Careers() {
  const careers = useLoaderData();

  return (
    <div className="careers">
      {careers.products.map((career) => (
        <Link to={career.id.toString()} key={career.id}>
          <p>id: {career.id}</p>
          <p>title: {career.title}</p>
          <p>description: {career.description}</p>
        </Link>
      ))}
    </div>
  );
}

// data loader
export const careersLoader = async () => {
  const res = await fetch("https://dummyjson.com/products");
  if (!res.ok) {
    throw Error("Could not fetch the products");
  }
  return res.json();
};
