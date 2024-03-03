import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../../assets/human6.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import UserSidebar from "./UserSidebar";

function UserAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [userData, setuserData] = useState([]);


  const colorForStatus= (status) => {
    switch(status){
      case "scheduled":
        return "text-orange-300";
      case "inProgress":
        return "text-blue-300";
      case "completed":
        return "text-green-300";
      case "cancelled":
        return "text-red-300";
      default:
        return "text-green-300";
    }
  
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setuserData(user);
    const email = user.email;
    const fetchAppointments = async (email) => {
      await axios
        .get(`https://hmsmern.onrender.com/appointment/get-appointments/${email}`)
        .then((res) => {
          setAppointments(res.data);
        })
        .catch((err) => {
          Swal.fire({
            title: "Error",
            icon: "error",
            confirmButtonText: "Ok",
            text: "Error Fetching Appointments! Please Try Again!",
          });
        });
    };

    fetchAppointments(email);

  }, []);
  return (
    <section className="flex items-center justify-center bg-slate-300">
      <div className="flex h-[80%] w-[80%] bg-white p-2 shadow-xl">
      <UserSidebar profiePic={profiePic} userName={userData.userName} />
        <div>
          <div className="flex flex-col gap-4 p-4">
            <h1 className="text-3xl font-medium">Appointments</h1>
            <div className="flex flex-col gap-4">
              {appointments.map((appointment,index) => {
                const appointmentDate = new Date(appointment.appointmentDate);
                const formattedDate = appointmentDate.toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric"
                });
                return (
                  <div className="flex flex-col m-5 ml-10 gap-4" key={index}>
                    <div className="flex gap-4 justify-between">
                      <p className="text-lg font-medium">
                        Doctor : {appointment.doctor.name}
                      </p>
                      <p className="text-lg font-medium"> Date and Time : {formattedDate}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-lg ">Reason : {appointment.reason}</p>
                      <p className="text-lg font-medium">Status of Appointment:<p className={`${colorForStatus(appointment.status)}`}>{appointment.status}</p></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserAppointment;
