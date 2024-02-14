import React, { useState } from 'react'
import Navbar from '../Shared/Navbar'
import banner from '../../assets/AboutUs.jpg'
import slide1 from '../../assets/slide2.jpg'
import slide2 from '../../assets/slide3.jpg'
import slide3 from '../../assets/slide4.jpg'
import slide4 from '../../assets/slide5.jpg'
function AboutUs() {

  const slideImages = [slide1 , slide2 , slide3 , slide4];
  let [current , setCurrent] = useState(0);

  let prevSlide = ()=>{
    if(current==0) setCurrent(slideImages.length -1)
    else setCurrent(current-1);
  }
  let nextSlide = ()=>{
    if(current==slideImages.length -1) setCurrent(0)
    else setCurrent(current+1);
  }

  return (
    <>
    <Navbar/>
    <section className='pt-[80px] bg-[#FEFAE0]'>    
      <div className='h-screen w-screen '>
        <img src={banner} alt="banner" className='' />
        <div className='z-10 bottom-0 hidden lg:block lg:left-32 py-4 rounded-t-lg lg:w-[400px] text-center bg-[#FAEDCD] absolute '>
          <p className='font-semibold text-3xl'>About HMS</p>
        </div>
      </div>
    
    
    </section>
    <section className=' bg-[#FEFAE0] pt-5'>
    <div className='h-screen max-w-7xl flex flex-col m-auto justify-center text-justify gap-1'>
        <p className='text-2xl font-semibold'>Background</p>
        <p className='text-lg'>HMS is a quaternary care hospital network offering end-to-end healthcare services, right from primary to quaternary care in India and Middle-east. HMS Hospital is owned and managed by M/s HMS Health Care Management Limited, a public limited company incorporated under the Companies Act, 1956 with an objective to provide world-class affordable healthcare services the Company commenced its operations in the year 1999. Currently, the Company is in the business of delivering quality healthcare services through a wide network of multi-specialty hospitals, which provide healthcare to its guests.

            HMS has pioneered the quality revolution in the field of healthcare delivery in the country, making quality healthcare affordable and accessible to everyone. Due to our relentless and keen focus on quality healthcare delivery. </p>
        <p className='text-lg hidden lg:block'>In addition to this, the Blood Center is also accredited by NABH and the laboratory is NABL (National Accreditation Board for Testing and Calibration of Laboratories) accredited.

          Today, HMS stands among the top 10 hospitals in India with top-notch healthcare delivery systems, evidence-based medicine, high-end facilities, and quality-oriented practices. The Group started in the year 2002 with its flagship quaternary-care hospital at Trivandrum. From there, HMS is now one of the largest healthcare networks, growing from a 250-bed to a 2000-bed healthcare group, with hospitals in major cities like Trivandrum, Kollam, Kottayam and Perinthalmanna; in addition to its hospitals in Bahrain, Oman, Saudi Arabia, Qatar and UAE. The group’s newest addition, KIMSHEALTH East is an outstanding healthcare facility with the most modern Operation Theatres, ICUs of international standards and a Transplant Program for the Kidney, Liver and Pancreas. In addition, it will be a centre of excellence for wellness, High-risk obstetrics, advanced Perinatology and Neonatology

          Thus, HMS touches upon all aspects of wellness and healthcare, with a fine fusion of cardinal principles of holistic care and hospitality with the three-pronged approach of courtesy, compassion, and competence</p>
      </div>
    </section>
    <section className=' bg-[#FEFAE0] lg:pt-5'>
    <div className='h-screen max-w-7xl flex flex-col m-auto justify-center text-justify gap-1'>
        <p className='text-2xl font-semibold'>Group Chairman's Message</p>
        <p className='text-lg font-medium self-center'>- Dr. M.I. Sahadulla</p>
        <p className='text-lg'>HMS has been revolutionizing the art of healthcare delivery through its focus on quality, patient safety and ethical practices. The group has established a fine tradition of healing by upholding the strengths of competence, compassion, technology and digitalization. Today, HMS is the largest healthcare network in the state of Kerala and is among the top leading healthcare organizations in the country. With a team of dedicated professionals who bring experience and expertise, cutting-edge facilities, world class treatment protocols, we strive to deliver quality care balancing the high expectations of patients and the increasing cost of medical technology. 

            Thus, HMS touches upon all aspects of wellness and healthcare, with a fine fusion of cardinal principles of holistic care and hospitality with the three-pronged approach of courtesy, compassion, and competence.</p>
        <p className=' hidden lg:block text-lg'>For us healthcare is not just a profession but a calling, where our patients and their families become an integral part of our legacy. As we complete 22 years, we are now present in six countries, with 1060 doctors and 6,000 direct employees and millions of guests who trust us. Our flagship hospital in Thiruvananthapuram has grown steadily from 300 beds. With the completion of HMS East, the hospital will have 900 beds, taking HMS’s total number of beds to about 2,000 across India and the GCC. HMS East is an outstanding healthcare facility with most modern Operation Theatres, Robotic Surgery Unit, ICUs of international standards and Transplant program for Kidney, Liver, Pancreas, Heart and Lungs. In addition, it will be a center of excellence for wellness, High-risk OB, advanced Perinatology, Neonatology and Cosmetics & Plastic Surgery. The building is designed as highly energy efficient, environment-friendly as well as excelling in design and ambiance with an aspiration for IGBC (Indian Green Building Council) Platinum rating, which is the highest rating for green buildings in India. We at HMS are committed to our mission “To provide high-quality cost-effective care with courtesy, compassion and competence.” I thank you for your interest in HMS and urge you to discover the difference that we can bring together in the healthcare space.</p>
      </div>
    </section>
    <section className='bg-[#FEFAE0] '>
      <div className='max-w-7xl m-auto h-full flex flex-col justify-center items-center gap-3  '>
        <p className='text-3xl font-semibold'>Image Gallery</p>
        <div className='h-[70%] w-[70%] flex shadow-lg border border-5 shadow-black  transition ease-out duration-40'
        style={{
          transform:`translateX(-${current * 100}%)`,
        }}>
          {slideImages.map((images,index)=>{
            return(
              <img src={images} alt="slider" key={index} />
            )
          })}
        </div>
        <div className='absolute  w-[59%] h-full flex justify-between items-center pt-5'>
          <button 
          onClick={prevSlide}
          className='bg-black rounded-full p-1 ms-1'>
            <svg className='size-10' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path></svg>
          </button>
          <button 
          onClick={nextSlide}
          className='bg-black rounded-full p-1 me-2'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className='size-10' fill="white"><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
          </button>
        </div>
      </div>
    </section>
    
    </>
  )
}

export default AboutUs