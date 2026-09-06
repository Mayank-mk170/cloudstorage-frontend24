import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();

    const isLoginPage = location.pathname === "/login";
    const isRegisterPage = location.pathname === "/register";

    return (
        <header className="w-full border-b bg-white">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                
                {/* LOGO */}
                <Link
                    to="/"
                    className="text-2xl font-bold text-slate-900"
                >
                    Cloud Storage
                </Link>

                {/* AUTH NAVIGATION */}
                <div className="flex items-center gap-3">
                    
                    {/* SIGN IN */}
                    <Link
                        to="/login"
                        className={
                            isLoginPage
                                ? "rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
                                : "rounded-xl px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                        }
                    >
                        Sign In
                    </Link>

                    {/* SIGN UP */}
                    <Link
                        to="/register"
                        className={
                            isRegisterPage
                                ? "rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
                                : "rounded-xl px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                        }
                    >
                        Sign Up
                    </Link>

                </div>
            </div>
        </header>
    );
}

export default Navbar;