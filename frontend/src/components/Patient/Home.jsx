import React from 'react'
import Navbar from '../Shared/Navbar';
import banner from "../../assets/hero.png"
function Home() {
  return (
    <div className='bg-slate-300'>

        <section>
            <Navbar/>
            <div className='flex flex-col lg:flex-row h-screen w-screen justify-center items-center max-w-7xl m-auto'>
                <div className='flex flex-col justify-center'> 
                    <p className='text-3xl font-semibold text-center'>The Power to Heal </p> 
                    <p className='text-lg text-center'>To Undertake Specialized And holistic healthcare
                        services of world standard and to provide them to all sections....
                    </p>
                </div>
                <div className='w-full md:w-[80%] lg:w-[80%]'><img src={banner} alt="hero"  className='h-[400px]'/></div>
            </div>
        
        </section>
        <section>Our services</section>
        <section>our docs</section>
        <section>People thought</section>
        <section>footer</section>
    </div>
  )
}

export default Home