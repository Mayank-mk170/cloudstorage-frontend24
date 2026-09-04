import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                <Link
                    to="/"
                    className="text-2xl font-bold text-gray-900"
                >
                    Cloud Storage
                </Link>

                <div className="flex items-center gap-6">

                    <Link
                        to="/login"
                        className="text-sm font-semibold text-gray-700 hover:text-blue-600"
                    >
                        Sign In
                    </Link>

                    <Link
                        to="/register"
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Sign Up
                    </Link>

                </div>

            </div>
        </nav>
    );
}

export default Navbar;