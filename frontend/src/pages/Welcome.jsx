import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar, FiCreditCard, FiHeart, FiMapPin, FiShield, FiTruck } from "react-icons/fi";
import { FaPills } from "react-icons/fa";
import { GiStethoscope } from "react-icons/gi";

const Welcome = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />

      <div className="grid h-screen grid-cols-1 md:grid-cols-2">
        <section className="flex items-center px-6 py-6 md:px-14 lg:px-20">
          <div className="max-w-xl space-y-5">
            <p className="inline-flex rounded-full bg-cyan-500/20 px-4 py-1 text-sm font-semibold text-cyan-200">
              Your health, organized daily
            </p>

            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
              Welcome to{" "}
              <span className="inline-flex items-center">
                MediTracker
                <span className="ml-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-300/30">
                  <FaPills className="h-6 w-6" />
                </span>
              </span>
            </h1>

            <p className="text-lg text-slate-200 md:text-xl">
              Track medicines, manage appointments, and stay on schedule with one smart health companion.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Start using MediTracker by logging in
                <FiArrowRight className="ml-2" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl border border-slate-500 bg-slate-800 px-6 py-3 font-semibold !text-white shadow-sm transition hover:bg-slate-700"
              >
                Create new account
              </Link>
            </div>
          </div>
        </section>

        <section className="flex items-center p-5 md:p-8 lg:p-10">
          <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-700 to-emerald-700 p-5 text-white shadow-2xl md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold md:text-3xl">Why users love it</h2>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-cyan-100">
                <GiStethoscope className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiCalendar className="mr-3 mt-1 h-5 w-5" />
                <p>Simple reminders for every dose and daily routine.</p>
              </div>
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiHeart className="mr-3 mt-1 h-5 w-5" />
                <p>Appointments, doctors, and slots in one place.</p>
              </div>
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiShield className="mr-3 mt-1 h-5 w-5" />
                <p>Secure account flow with personalized experience.</p>
              </div>
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiTruck className="mr-3 mt-1 h-5 w-5" />
                <p>Instant ambulance booking with hospital-wise availability.</p>
              </div>
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiMapPin className="mr-3 mt-1 h-5 w-5" />
                <p>Nearby hospitals map with travel time by walk, bike, and car.</p>
              </div>
              <div className="flex items-start rounded-xl bg-white/15 p-3 text-sm">
                <FiCreditCard className="mr-3 mt-1 h-5 w-5" />
                <p>Smooth appointment payment flow for fast confirmations.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Welcome;
