import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="container-bms py-24 text-center">
        <h1 className="font-heading text-5xl font-extrabold text-bms-red">404</h1>
        <p className="text-bms-grey mt-3">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-red inline-block mt-5">Back to home</Link>
      </div>
    </Layout>
  );
}
