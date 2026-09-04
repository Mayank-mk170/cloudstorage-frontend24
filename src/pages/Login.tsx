import { useState } from "react";
import type { FormEvent } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useMutation,
} from "@tanstack/react-query";

import {
    login,
} from "../services/authService";


function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const loginMutation = useMutation({

        mutationFn: login,

        onSuccess: (data) => {

            console.log("Login successful:", data);

            localStorage.setItem(
                "token",
                data.token
            );

            navigate("/dashboard");
        },

        onError: (error) => {

            console.error(
                "Login failed:",
                error
            );
        },

    });


    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        loginMutation.mutate({
            email,
            password,
        });

    };


    return (

        <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-12">

            <div className="mx-auto w-full max-w-md">

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

                    {/* TITLE */}

                    <div className="mb-8">

                        <h1 className="text-2xl font-bold text-gray-900">
                            Sign in
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Welcome back. Sign in to access your files.
                        </p>

                    </div>


                    {/* ERROR */}

                    {loginMutation.isError && (

                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">

                            Invalid email or password.

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* EMAIL */}

                        <div>

                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="Enter your email"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        {/* PASSWORD */}

                        <div>

                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter your password"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        {/* BUTTON */}

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {loginMutation.isPending
                                ? "Signing in..."
                                : "Sign in"}

                        </button>

                    </form>


                    {/* REGISTER */}

                    <p className="mt-6 text-center text-sm text-gray-600">

                        Don't have an account?{" "}

                        <Link
                            to="/register"
                            className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Sign up
                        </Link>

                    </p>

                </div>

            </div>

        </main>

    );
}


export default Login;