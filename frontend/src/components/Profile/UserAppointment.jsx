import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../assets/human6.jpg";
import axios from "axios";

function UserAppointment() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user.email;
    const fetchAppointments = async (email) => {
      await axios
        .get(`http://localhost:4451/appointment/get-appointment/${email}`)
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

  const navLinkStyle = ({ isActive }) => {
    return {
      fontWeight: isActive ? "600" : "400",
      color: isActive ? "white" : "black",
      backgroundColor: isActive ? "black" : "white",
    };
  };

  return (
    <section className="flex items-center justify-center bg-slate-300">
      <div className="flex h-[80%] w-[80%] bg-white p-2 shadow-xl">
        <div className="bg-slate- flex h-full w-[18%] flex-col justify-between p-2 ">
          <div className="flex flex-col gap-16">
            <div className="g flex w-full flex-col items-center">
              <img
                src={profiePic}
                className="size-24 rounded-full"
                alt="profile"
              />
              <p>Name</p>
            </div>
            <div className="flex w-full flex-col items-start gap-4 ">
              <NavLink
                style={navLinkStyle}
                className={"h-[40px]   w-full p-2 "}
                to="/user-profile"
              >
                Settings
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"h-[40px]  w-full p-2 "}
                to="/user-appointments"
              >
                History
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"h-[40px] w-full p-2 "}
                to="/user-book-appointment"
              >
                Book Appointment
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"h-[40px] w-full p-2 "}
                to="/user-medication"
              >
                Medication
              </NavLink>
            </div>
          </div>
          <div className="h-[80px] w-full  p-2 text-center">
            <button className="text-md cursor-pointer rounded-full bg-black p-2 font-medium text-white duration-200 hover:scale-110 active:scale-90 ">
              Sign Out
            </button>
          </div>
        </div>
       
      </div>
    </section>
  );
}

export default UserAppointment;
