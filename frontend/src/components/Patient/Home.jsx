import React from 'react'
import Navbar from '../Shared/Navbar';
import banner from "../../assets/hero.png"
import service from "../../assets/services.png"
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
                <div className='w-full md:w-[80%] lg:w-[80%]'><img src={banner} alt="hero"  className='h-[400px]  shadow-black'/></div>
            </div>
        
        </section>
        <section>
            <div className='w-full h-full flex flex-col justify-center items-center'>
                <p className='font-semibold text-3xl'>Why Choose Us?</p>
                <div className='flex flex-col md:flex-row justify-center  items-center'>
                    <div>first</div>
                    <div className='hidden md:block'><img src={service} alt="services" className='h-[400px]' /></div>
                    <div>third</div>
                </div>
            </div>
        </section>
        <section>our docs</section>
        <section>People thought</section>
        <section>footer</section>
    </div>
  )
}

export default Home