import React, { useEffect, useState } from "react";
import Navbar from "../Shared/Navbar";
import appoint from "../../assets/appoint.png";
import axios from "axios";
import Swal from "sweetalert2";

function Appointment() {
  const [doctors, setDoctors] = useState([]);

  const [appointment, setAppointment] = useState({
    patient: "",
    phone: "",
    appointmentDate: "",
    time: "",
    doctor: "",
    reason: "",
    email: "",
  });

  useEffect(() => {
    const fetchDoctors = async (e) => {
      const res = await axios.get("http://localhost:4451/doctor/get-doctors");
      setDoctors(res.data);
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios
      .post(`http://localhost:4451/appointment/add-appointment`, {
        patient: appointment.patient,
        phone: appointment.phone,
        doctor: appointment.doctor,
        appointmentDate: appointment.appointmentDate + " " + appointment.time,
        reason: appointment.reason,
        email: appointment.email,
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
    <section className="bg-[#FEFAE0]">
      <Navbar />
      <div className="h-screen f-screen  flex justify-center items-center">
        <div className=" h-[80%] w-full mt-[80px] flex justify-center items-center gap-5 rounded-xl">
          <div>
            <img src={appoint} className="size-80" alt="nurse" />
          </div>
          <div className=" shadow-xl bg-[#FAEDCD] shadow-black md:w-[50%]">
            <form className="flex flex-col w-full h-full  gap-4 p-5 justify-center items-center">
              <p className="text-2xl font-semibold">Book Appointment</p>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-full">
                  Name:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="text"
                    placeholder="Name"
                  />
                </div>
                <div className="w-full">
                  Phone Number:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="number"
                    placeholder="Phone/Mobile"
                  />
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-[90%]">
                  Date Of Appointment:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="date"
                    placeholder="Date"
                  />
                </div>
                <div className="w-[90%]">
                  Time Of Appointment:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="time"
                    placeholder="Time"
                  />
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-full">
                  Choose Doctor Name:
                  <select
                    id="doctors"
                    className="h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Choose you Consultant">
                      Choose you Consultant
                    </option>
                    {doctors.map((doctors) => (
                      <option key={doctors._id} value={doctors.name}>
                        {bike.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full ">
                  Enter Reason:
                  <textarea
                    className="h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    rows="10"
                    placeholder="Reason"
                  ></textarea>
                </div>
              </div>
              <div className="w-full flex m-2 justify-center items-center">
                <div className="w-full">
                  Email:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Enter Email"
                  />
                </div>
                <div className="w-full">
                  Email:
                  <input
                    className=" h-10 w-[300px] rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Enter Email"
                  />
                </div>
              </div>
              <button
                className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                onClick={(e) => handleSubmit(e)}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Appointment;
