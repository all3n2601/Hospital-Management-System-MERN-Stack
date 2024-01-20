import React from 'react'
import Navbar from '../Shared/Navbar'
function ContactUs() {
  return (
    <section className='h-screen w-screen bg-slate-300'>
      <Navbar/>
      <div className='h-screen w-screen flex justify-center items-center pt-24'>

        <div className="flex gap-10 mx-14 py-14">
            <div className="flex-col hidden md:flex">
                <span className='text-zinc-650 text-4xl'>Locate Us</span>
                <br/>
                <span className='text-zinc-550 text-2xl'>HMS Trivandrum - India</span>
                <span className='text-zinc-500 text-base'>HMS, RandomAddress, ExampleBlah, Trivandrum – XXXXXX, Kerala, India</span>
                <br/>
                <div className="flex gap-20 items-start">
                    <div className="flex flex-col">
                        <span className='text-zinc-650 text-2xl'>Telephone</span>
                        <span className='text-zinc-500 text-base'>+91 123 456 7890</span>
                    </div>
                    <div className="flex flex-col">
                        <span className='text-zinc-650 text-2xl'>Emergency</span>
                        <span className='text-zinc-500 text-base'>+91 123 456 7890</span>
                    </div>
                    <div className="flex flex-col">
                        <span className='text-zinc-650 text-2xl'>Corporate Enquiries</span>
                        <span className='text-zinc-500 text-base'>+91 123 456 7890</span>
                    </div>
                </div>
                <br/>
                <div className="flex flex-col">
                    <span className='text-zinc-650 text-2xl'>Email</span>
                    <span className='text-zinc-500 text-base'>feedback@hms.org</span>
                </div>
            </div>
            <div className="flex flex-col w-[500px] h-4/5 p-4 justify-center items-center gap-10 border border-solid rounded-lg border-transparent shadow-xl shadow-slate-950">
                <span className='text-zinc-650 text-3xl font-medium'>Get in touch</span>
                <input className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="text"
                    placeholder="Name *"
                />
                <input
                    className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="number"
                    placeholder="Phone / Mobile *"
                />
                <input
                    className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Email Address *"
                />
                <textarea id="message" rows="4" className="flex h-30 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50" 
                placeholder="Message *"></textarea>
                <button
                    type="button"
                    className="rounded-md bg-blue-600 px-10 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-600/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    Submit
                </button>
            </div>
        </div>
      </div>

    </section>
  )
}

export default ContactUs