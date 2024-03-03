import React, { useEffect, useState } from "react";
import Navbar from "../Shared/Navbar";
import appoint from "../../assets/appoint.png";
import axios from "axios";
import Swal from "sweetalert2";
import {motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';

function Appointment() {
  const [doctors, setDoctors] = useState([]);

  const { ref, inView } = useInView({
    triggerOnce: true, 
    threshold: 0.3, 
  });

  const [appointment, setAppointment] = useState({
    patient: "",
    phone: "",
    appointmentDate: "",
    date:new Date(),
    time: "",
    doctor: "",
    reason: "",
    email: "",
    city:"",
  });

  useEffect(() => {
    const fetchDoctors = async (e) => {
      const res = await axios.get("https://hmsmern.onrender.com/doctor/get-doctors");
      setDoctors(res.data);
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios
      .post(`https://hmsmern.onrender.com/appointment/add-appointment`, {
        patient: appointment.patient,
        phone: appointment.phone,
        doctor: appointment.doctor,
        appointmentDate: appointment.appointmentDate ,
        reason: appointment.reason,
        email: appointment.email,
        time: appointment.time,
      })
      .then((res) => {
        Swal.fire({
          title: "Success",
          icon: "success",
          confirmButtonText: "Ok",
          text: "Appointment Request Sent Successfully!",
        });
       
      })
      .catch((err) => {
        Swal.fire({
          title: "Error",
          icon: "error",
          confirmButtonText: "Ok",
          text: "Error Sending Appointment Request! Please Try Again!",
        });
      });
  };

  return (
    <motion.section
    

    className="bg-[#FEFAE0]">
      <Navbar />
      <div className="h-screen f-screen  flex justify-center items-center">
        <div className=" h-[80%] w-full mt-[80px] flex justify-center items-center gap-5 rounded-xl">
          <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -50 }} 
          transition={{ duration: 1.5 }}
          whileInView={{ opacity: 1 }}
           className="hidden lg:block">
            <img src={appoint} className="size-80" alt="nurse" />
          </motion.div>
          <motion.div
          ref={ref}
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 50 }} 
          transition={{ duration: 1.5 }}
          whileInView={{ opacity: 1 }}
          
          className=" shadow-xl bg-[#FAEDCD] shadow-black lg:w-[50%] w-full overflow-auto">
            <form className="flex flex-col w-full h-full  gap-4 p-5 justify-center lg:ps-14 items-center">
              <p className="text-2xl font-semibold">Book Appointment</p>
              <div className="w-full flex m-2 justify-center items-center ">
                <div className="w-full flex flex-col">
                  Name:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="text"
                    placeholder="Name"
                    onChange={(e) => setAppointment({ ...appointment, patient: e.target.value })}
                  />
                </div>
                <div className="w-full flex flex-col">
                  Phone Number:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="number"
                    placeholder="Phone/Mobile"
                    onChange={(e) => setAppointment({ ...appointment, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-[90%] flex flex-col">
                  Date Of Appointment:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="date"
                    placeholder="Date"
                    onChange={(e) => setAppointment({ ...appointment, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="w-[90%] flex flex-col">
                  Time Of Appointment:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="time"
                    placeholder="Time"
                    onChange={(e) => setAppointment({ ...appointment, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-full flex flex-col">
                  Choose Doctor Name:
                  <select
                    id="doctors"
                    className="h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setAppointment({ ...appointment, doctor: e.target.value })}
                  >
                    <option value="Choose you Consultant">
                      Choose you Consultant
                    </option>
                    {doctors.map((doctors) => (
                      <option key={doctors._id} value={doctors.name}>
                        {doctors.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full flex flex-col">
                  Enter Reason:
                  <textarea
                    className="h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    rows="10"
                    placeholder="Reason"
                    onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-full flex flex-col">
                  Email:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Enter Email"
                    onChange={(e) => setAppointment({ ...appointment, email: e.target.value })}
                  />
                </div>
                <div className="w-full flex flex-col">
                  City: 
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Enter Email"
                    onChange={(e) => setAppointment({ ...appointment, city: e.target.value })}
                  />
                </div>
              </div>
              <button
                className="inline-flex w-[95%]  items-center justify-center lg:me-10 rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                onClick={(e) => handleSubmit(e)}
              >
                Submit
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

export default Appointment;
