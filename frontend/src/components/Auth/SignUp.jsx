import React from 'react'

function SignUp() {
  return (
    <section className='bg-[#FEFAE0] h-screen f-screen'>
        <div className="flex items-center justify-center px-8 py-24">
            <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md bg-[#CCD5AE] shadow-xl shadow-black p-5 rounded-lg mt-6">
            
            <h2 className="text-center text-2xl font-bold leading-tight text-black">
                Sign up to create account
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
                Already have an account?{' '}
                <a
                href="/sign-in"
                title=""
                className="font-medium text-black transition-all duration-200 hover:underline"
                >
                Sign In
                </a>
            </p>
            <form  className="mt-8">
                <div className="space-y-5">
                <div>
                    <label htmlFor="name" className="text-base font-medium text-gray-900">
                    {' '}
                    Full Name{' '}
                    </label>
                    <div className="mt-2">
                    <input
                        className="flex h-10 w-full rounded-md border border-black bg-transparent px-3 py-2 text-sm placeholder:text-black focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        type="text"
                        placeholder="Full Name"
                        id="name"
                    ></input>
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="text-base font-medium text-gray-900">
                    {' '}
                    Email address{' '}
                    </label>
                    <div className="mt-2">
                    <input
                        className="flex h-10 w-full rounded-md border border-black bg-transparent px-3 py-2 text-sm placeholder:text-black focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        type="email"
                        placeholder="Email"
                        id="email"
                    ></input>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-base font-medium text-gray-900">
                        {' '}
                        Password{' '}
                    </label>
                    </div>
                    <div className="mt-2">
                    <input
                        className="flex h-10 w-full rounded-md border border-black bg-transparent px-3 py-2 text-sm placeholder:text-black focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        type="password"
                        placeholder="Password"
                        id="password"
                    ></input>
                    </div>
                </div>
                </div>
            </form>
            <div className="mt-3 space-y-3">
                <button
                type="button"
                className="relative inline-flex w-full items-center justify-center rounded-md border border-gray-400 bg-black px-3.5 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-slate-900 "
                >
                Sign up 
                </button>
            </div>
            </div>
      </div>
    </section>
  )
}

export default SignUp