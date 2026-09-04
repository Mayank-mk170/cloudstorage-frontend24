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
    register,
} from "../services/authService";


function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const registerMutation = useMutation({

        mutationFn: register,

        onSuccess: () => {

            console.log(
                "Registration successful"
            );

            navigate("/login");

        },

        onError: (error) => {

            console.error(
                "Registration failed:",
                error
            );

        },

    });


    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        registerMutation.mutate({
            name,
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
                            Create account
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Create your Cloud Storage account.
                        </p>

                    </div>


                    {/* ERROR */}

                    {registerMutation.isError && (

                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">

                            Registration failed.
                            Please check your details.

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* NAME */}

                        <div>

                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter your name"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


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
                                placeholder="Create a password"
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>


                        {/* BUTTON */}

                        <button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            {registerMutation.isPending
                                ? "Creating account..."
                                : "Create account"}

                        </button>

                    </form>


                    {/* LOGIN */}

                    <p className="mt-6 text-center text-sm text-gray-600">

                        Already have an account?{" "}

                        <Link
                            to="/login"
                            className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Sign in
                        </Link>

                    </p>

                </div>

            </div>

        </main>

    );
}


export default Register;