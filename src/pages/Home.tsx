import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="min-h-[calc(100vh-64px)] bg-gray-50">

            <section className="mx-auto max-w-7xl px-6 py-24 text-center">

                <h1 className="text-5xl font-bold tracking-tight text-gray-900">
                    Your files.
                    <span className="text-blue-600"> Anywhere.</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                    Store, manage, share and access your files securely
                    from anywhere with Cloud Storage.
                </p>

                <div className="mt-10 flex justify-center gap-4">

                    <Link
                        to="/register"
                        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        Get Started
                    </Link>

                    <Link
                        to="/login"
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Sign In
                    </Link>

                </div>

            </section>

        </main>
    );
}

export default Home;