import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../../assets/doct2.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import DoctorSidebar from "./DoctorSidebar";

function DoctorAppointmen() {
  const [userData, setuserData] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchInfo = async (e) => {
      const user = JSON.parse(localStorage.getItem("user"));
      setuserData(user);
    };

    console.log(userData);

    const fetchAppointments = async (e) => {
    await axios.get(
        `http://localhost:4451/doctor/get-appointments/${userData._id}`
      ).then((response) => {
        if(response.data.message === "No appointments found"){
            Swal.fire({
                icon: "info",
                title: "Oops...",
                text: "No appointments found!",
            });
        }else{
            setAppointments(response.data);
        }
      }).catch((error) => {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!"+error.message,
        })
      });
    };

    fetchInfo();
    fetchAppointments();
  }, []);

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <DoctorSidebar userName={userData.name} profiePic={profiePic} />
        <div className=" w-[70%] ms-24 p-4 flex flex-col overflow-auto ">
         {appointments.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2">Patient Name</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment, index) => (
                  <tr key={index}>
                    <td className="p-2">{appointment.patientName}</td>
                    <td className="p-2">{appointment.date}</td>
                    <td className="p-2">{appointment.time}</td>
                    <td className="p-2">{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <p>No appointments found</p>
            </div>
          )
         }
        </div>
      </div>
    </section>
  );
}

export default DoctorAppointmen;
