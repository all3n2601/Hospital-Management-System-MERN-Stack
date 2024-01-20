import React from 'react'

function DoctorAuth() {
  return (
    <section className='bg-slate-300 h-screen w-screen'>
        <div className="flex items-center justify-center h-full max-w-7xl m-auto md:w-[60%] rounded-xl lg:w-[40%]  ">
        <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md bg-white p-4 rounded-lg">
          <h2 className="text-center text-2xl font-bold leading-tight text-black">
            Doctor SignIn
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 ">
            Login As A Patient?{' '}
            <a
              href="/sign-in"
              title=""
              className="font-semibold text-black transition-all duration-200 hover:underline"
            >
              Click Here
            </a>
          </p>
          <form  className="mt-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="" className="text-base font-medium text-gray-900">
                  {' '}
                  Email address{' '}
                </label>
                <div className="mt-2">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Email"
                  ></input>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="" className="text-base font-medium text-gray-900">
                    {' '}
                    Password{' '}
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="password"
                    placeholder="Password"
                  ></input>
                </div>
              </div>
              <div className='flex flex-col gap-3'>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                >
                  Get started
                </button>
                
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default DoctorAuth