import { useRole } from "./RoleContext.jsx";
import { FaUser, FaUserTie, FaHardHat, FaUserShield } from "react-icons/fa";

function NavBar() {
  const { role, setRole } = useRole();

  const roles = [
    { name: "citizen", icon: <FaUser size={24} />, alt: "Citizen" },
    { name: "manager", icon: <FaUserTie size={24} />, alt: "Manager" },
    { name: "inspector", icon: <FaHardHat size={24} />, alt: "Inspector" },
    { name: "builder", icon: <FaUserShield size={24} />, alt: "Builder" },
  ];

  return (
    <div className="absolute top-4 left-4 p-3 flex flex-col gap-4 bg-transparent rounded-xl z-50">
      {roles.map((r) => (
        <button
          key={r.name}
          onClick={() => setRole(r.name)}
          title={r.alt}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 focus:outline-none
            ${role === r.name
              ? "bg-gray-800 text-white scale-110 shadow-lg"
              : "bg-white hover:bg-gray-400 hover:text-gray-900"}`
          }
        >
          {r.icon}
        </button>
      ))}
    </div>
  );
}

export default NavBar;
