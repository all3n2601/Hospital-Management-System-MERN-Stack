import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../assets/human6.jpg";
import axios from "axios";
import Swal from "sweetalert2";

function AdminNewsletter() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState([]);

  const fetchSentMessages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4451/admin/get-sent-newsletter"
      );
      const sortedMessages = response.data.sort((a, b) => b._id - a._id);
      setSentMessages(sortedMessages);
    } catch (err) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: "Error Fetching Data!",
      });
    }
  };

  useEffect(() => {
    fetchSentMessages();
  }, []);

  const handleAddNewsletter = async (e) => {
    e.preventDefault();
    await axios
      .post("http://localhost:4451/admin/new-letter", {
        subject: subject,
        message: message,
      })
      .then((res) => {
        if (res.data.status == "Saved") {
          Swal.fire({
            title: "Success",
            icon: "success",
            text: "Message Sent SuccessFully!",
          });
        }

        setSubject("");
        setMessage("");
      })
      .catch((err) => {
        Swal.fire({
          title: "Error",
          icon: "error",
          text: "Message Could Not Be Sent!",
        });
      });

    fetchSentMessages();
  };

  const navLinkStyle = ({ isActive }) => {
    return {
      fontWeight: isActive ? "600" : "400",
      color: isActive ? "white" : "black",
      backgroundColor: isActive ? "black" : "white",
    };
  };

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <div className="bg-slate- h-full w-[18%] flex flex-col justify-between p-2 ">
          <div className="flex flex-col gap-6">
            <div className="w-full flex flex-col items-center ">
              <img
                src={profiePic}
                className="size-24 rounded-full"
                alt="profile"
              />
              <p className="font-semibold text-xl">Admin</p>
            </div>
            <div className="flex flex-col items-start w-full gap-3 ">
              <NavLink
                style={navLinkStyle}
                className={"w-full   p-2 h-[40px] "}
                to="/admin-dashboard"
              >
                Dashboard
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full  p-2 h-[40px] "}
                to="/admin-doctor"
              >
                Doctor
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-nurse"
              >
                Nurse
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-patient"
              >
                Patient
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-query"
              >
                Query
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-newsletter"
              >
                Newsletter
              </NavLink>
            </div>
          </div>
          <div className="w-full text-center  h-[80px] p-2">
            <button className="bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90 ">
              Sign Out
            </button>
          </div>
        </div>

        <div className="relative h-[50%] w-[90%] z-50 bg-white">
          <form className="flex flex-col w-full h-full justify-center gap-4 items-center">
            <div className="flex flex-col w-[70%] items-center ">
              <p className="">Enter Subject:</p>
              <input
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                type="text"
                placeholder="Subject"
              ></input>
            </div>

            <div className="flex flex-col h-full w-[70%] items-center ">
              <p className="">Enter Message:</p>
              <textarea
                onChange={(e) => setMessage(e.target.value)}
                className="flex h-full  min-h-[100px] w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={300}
                placeholder="Message"
              ></textarea>
            </div>

            <button
              type="submit"
              onClick={handleAddNewsletter}
              className=" w-[35%] bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90"
            >
              Send NewsLetter
            </button>
          </form>

          <br />

          <div className="flex m-50 h-[80%] justify-center items-center">
            <div className="m-25 pl-25 h-[100%] w-[90%] bg-amber-100 overflow-auto">
              <h2 className="text-black mx-auto text-lg">
                All Sent Messages!{" "}
              </h2>
              <ul className="mt-4">
                {sentMessages.map((message, index) => (
                  <li key={index} className="border-b border-gray-300 py-2">
                    <h3 className="text-lg font-semibold">{message.subject}</h3>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminNewsletter;
