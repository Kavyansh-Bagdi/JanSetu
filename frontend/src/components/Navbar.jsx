import { Link } from "react-router-dom";

function NavBar() {
  return (
    <div className="p-4 flex flex-col gap-4 w-1/5 bg-gray-900 text-white">
      <Link to="/" className="hover:text-gray-300">Home</Link>
      <Link to="/add_road" className="hover:text-gray-300">Add Road</Link>
      <Link to="/inspect_road" className="hover:text-gray-300">Inspect Road</Link>
    </div>
  );
}

export default NavBar;
