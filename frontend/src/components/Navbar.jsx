import { useRole } from "./RoleContext.jsx";
import { FaUser, FaUserTie, FaHardHat, FaUserShield } from "react-icons/fa"; // example icons

function NavBar() {
  const { role, setRole } = useRole();

  const roles = [
    { name: "citizen", icon: <FaUser size={24}/>, alt: "Citizen" },
    { name: "manager", icon: <FaUserTie size={24}/>, alt: "Manager" },
    { name: "inspector", icon: <FaHardHat size={24}/>, alt: "Inspector" },
    { name: "builder", icon: <FaUserShield size={24}/>, alt: "Builder" },
  ];

  return (
    <div className="absolute top-0 left-0 p-4 flex flex-col gap-4 w-40 bg-transparent text-black z-50">
      {roles.map((r) => (
        <div
          key={r.name}
          onClick={() => setRole(r.name)}
          className={`w-14 h-14 flex items-center justify-center rounded-full cursor-pointer transition ${
            role === r.name ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-500 hover:text-white"
          }`}
          title={r.alt}
        >
          {r.icon}
        </div>
      ))}
    </div>
  );
}

export default NavBar;