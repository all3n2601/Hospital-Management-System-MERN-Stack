import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  loginFailure,
  loginProgress,
  loginSuccess,
} from "../../redux/UserSlice.js";
import {motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';

function NurseAuth() {

  const { ref, inView } = useInView({
    triggerOnce: true, 
    threshold: 0.3, 
  });

  const [data, setData] = React.useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.user.loading);

  const [isPassVisible , setIsPassVisible] = useState(false);

  const handleVisible = () =>{
    setIsPassVisible(!isPassVisible);
  }
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginProgress());
    axios
      .post("https://hmsmern.onrender.com/auth/login", data)
      .then((res) => {
        if (res.data.role === "nurse") {
          const user = res.data.user;
          dispatch(login(user));
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          navigate("/nurse-profile");
          dispatch(loginSuccess());
        } else if (
          res.data.role === "doctor" ||
          res.data.role === "admin" ||
          res.data.role === "user"
        ) {
          dispatch(loginFailure());
          Swal.fire({
            title: "Invalid Role!",
            icon: "error",
            confirmButtonText: "Ok",
            text: "Login Through Your Respective Page!",
          });
        } else {
          dispatch(loginFailure());
          Swal.fire({
            title: "Invalid Access!",
            icon: "error",
            confirmButtonText: "Ok",
            text: "You are not authorized to access this page!",
          });
        }
      })
      .catch((err) => {
        dispatch(loginFailure());
        Swal.fire({
          title: "Invalid Credentials!",
          icon: "error",
          confirmButtonText: "Ok",
          text: "Please Check Your Credentials and Try Again!",
        });
      });
  };

  return (
    <section 

    className="bg-[#FEFAE0] h-screen w-screen">
      <motion.div
       ref={ref}
       initial={{ opacity: 0, x: -50 }} 
       animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -50 }} 
       transition={{ duration: 1.5 }}
       whileInView={{ opacity: 1 }}
        className="flex items-center justify-center h-full max-w-7xl m-auto md:w-[60%] rounded-xl lg:w-[40%]  ">
        <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md bg-[#CCD5AE] shadow-xl shadow-black p-4 rounded-lg">
          <h2 className="text-center text-2xl font-bold leading-tight text-black">
            Nurse SignIn
          </h2>
          <p className="mt-2 text-center text-sm text-slate-900 ">
            Login As A Patient?{" "}
            <Link
              to="/sign-in"
              title=""
              className="font-semibold text-black transition-all duration-200 hover:underline"
            >
              Click Here
            </Link>
          </p>
          <form className="mt-8">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor=""
                  className="text-base font-medium text-gray-900"
                >
                  {" "}
                  Email address{" "}
                </label>
                <div className="mt-2 flex justify-evenly items-center border-black border-2 rounded-lg">
                  <input
                    className="flex h-10 w-full rounded-md border  outline-none border-none bg-transparent px-3 py-2 text-sm placeholder:text-black  disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    placeholder="Email"
                    onChange={(e) =>
                      setData({ ...data, email: e.target.value })
                    }
                    value={data.email}
                  ></input>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor=""
                    className="text-base font-medium text-gray-900"
                  >
                    {" "}
                    Password{" "}
                  </label>
                </div>
                <div className="mt-2 flex justify-evenly items-center border-black border-2 rounded-lg">
                  <input
                    className="flex h-10 w-full rounded-md border  outline-none border-none bg-transparent px-3 py-2 text-sm placeholder:text-black  disabled:cursor-not-allowed disabled:opacity-50"
                    type={!isPassVisible ? "password":"text"}
                    placeholder="Password"
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    value={data.password}
                  ></input>
                  {!isPassVisible ?  <svg xmlns="http://www.w3.org/2000/svg" onClick={handleVisible} viewBox="0 0 24 24" className="size-8 pe-1 cursor-pointer " fill="currentColor"><path d="M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z"></path></svg>: 
                 
                 <svg xmlns="http://www.w3.org/2000/svg" className="size-8 pe-1 cursor-pointer " onClick={handleVisible} viewBox="0 0 24 24" fill="currentColor"><path d="M4.52047 5.93457L1.39366 2.80777L2.80788 1.39355L22.6069 21.1925L21.1927 22.6068L17.8827 19.2968C16.1814 20.3755 14.1638 21.0002 12.0003 21.0002C6.60812 21.0002 2.12215 17.1204 1.18164 12.0002C1.61832 9.62282 2.81932 7.5129 4.52047 5.93457ZM14.7577 16.1718L13.2937 14.7078C12.902 14.8952 12.4634 15.0002 12.0003 15.0002C10.3434 15.0002 9.00026 13.657 9.00026 12.0002C9.00026 11.537 9.10522 11.0984 9.29263 10.7067L7.82866 9.24277C7.30514 10.0332 7.00026 10.9811 7.00026 12.0002C7.00026 14.7616 9.23884 17.0002 12.0003 17.0002C13.0193 17.0002 13.9672 16.6953 14.7577 16.1718ZM7.97446 3.76015C9.22127 3.26959 10.5793 3.00016 12.0003 3.00016C17.3924 3.00016 21.8784 6.87992 22.8189 12.0002C22.5067 13.6998 21.8038 15.2628 20.8068 16.5925L16.947 12.7327C16.9821 12.4936 17.0003 12.249 17.0003 12.0002C17.0003 9.23873 14.7617 7.00016 12.0003 7.00016C11.7514 7.00016 11.5068 7.01833 11.2677 7.05343L7.97446 3.76015Z"></path></svg>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                >
                  Get started
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </section>
  );
}

export default NurseAuth;
