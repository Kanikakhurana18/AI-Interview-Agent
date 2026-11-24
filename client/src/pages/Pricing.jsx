
import React, { useState } from "react";
import { FaArrowLeft, FaCheck, FaGem, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Pricing() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [selectedPlan, setSelectedPlan] = useState("free");
    const [loadingPlan, setLoadingPlan] = useState(null);

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "₹0",
            credits: 100,
            description: "Perfect for beginners starting their interview preparation.",
            features: [
                "100 AI Interview Credits",
                "Basic Performance Report",
                "Voice Interview Access",
                "Limited History Tracking"
            ],
            default: true
        },
        {
            id: "basic",
            name: "Starter Pack",
            price: "₹100",
            amount: 10000,
            credits: 500,
            description: "Great for focused practice and improving your skills.",
            features: [
                "500 AI Interview Credits",
                "Detailed AI Feedback",
                "Performance Analytics",
                "Full Interview History"
            ]
        },
        {
            id: "pro",
            name: "Pro Pack",
            price: "₹1000",
            amount: 100000,
            credits: 1000,
            description: "The complete experience for serious job preparation.",
            features: [
                "1000 AI Interview Credits",
                "Advanced AI Feedback",
                "Skill Trend Analysis",
                "Priority AI Processing"
            ],
            badge: "Best Value"
        }
    ];

    const handlePayment = async (plan) => {
        if (plan.default) return;

        try {
            setLoadingPlan(plan.id);
            setSelectedPlan(plan.id);

            if (!window.Razorpay) {
                throw new Error("Razorpay SDK not loaded. Please refresh the page.");
            }

            const result = await axios.post(
                serverUrl + "/api/payment/order",
                {
                    planId: plan.id,
                    amount: plan.amount,
                    credits: plan.credits
                },
                { withCredentials: true }
            );

            const order = result.data.order || result.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "MockAura AI",
                description: `${plan.name} - ${plan.credits} Credits`,
                order_id: order.id,

                handler: async function (response) {
                    try {
                        const verifyPayment = await axios.post(
                            serverUrl + "/api/payment/verify",
                            response,
                            { withCredentials: true }
                        );

                        dispatch(setUserData(verifyPayment.data.user));
                        alert("Payment Successful! Credits Added.");
                        navigate("/");
                    } catch (error) {
                        console.error("Payment Verification Error:", error.response?.data || error.message);
                        alert(error.response?.data?.message || "Payment verification failed. Please contact support.");
                    } finally {
                        setLoadingPlan(null);
                    }
                },

                modal: {
                    ondismiss: () => setLoadingPlan(null)
                },

                theme: {
                    color: "#7657E8"
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (response) {
                console.log("Payment failed:", response.error);
                setLoadingPlan(null);
            });

            rzp.open();

        } catch (error) {
            console.error("Payment Error:", error.response?.data || error.message);
            alert(error.response?.data?.message || error.message || "Something went wrong.");
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9FF] px-5 py-12 sm:px-8 sm:py-16">

            <div className="max-w-6xl mx-auto mb-14">
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-[#EAE5FF] text-[#7657E8] hover:bg-[#F0EBFF] transition shadow-sm"
                    >
                        <FaArrowLeft />
                    </button>

                    <div className="flex items-center gap-2 text-[#7657E8] font-bold text-lg">
                        <FaGem />
                        <span>MockAura AI</span>
                    </div>
                </div>

                <div className="text-center max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-2 bg-[#F0EBFF] text-[#7657E8] px-4 py-2 rounded-full text-sm font-semibold mb-5">
                        <FaStar />
                        Simple and Flexible Pricing
                    </span>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#211B3A] tracking-tight">
                        Choose Your Plan
                    </h1>

                    <p className="text-[#77718D] mt-4 text-base sm:text-lg leading-relaxed">
                        Invest in your preparation. Practice smarter and get ready to crack your next interview.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-6xl mx-auto items-stretch">

                {plans.map((plan, index) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.12 }}
                            whileHover={!plan.default ? { y: -7 } : {}}
                            onClick={() => {
                                if (!plan.default) setSelectedPlan(plan.id);
                            }}
                            className={`relative flex flex-col rounded-3xl p-7 sm:p-8 border transition-all duration-300
                                ${isSelected
                                    ? "border-[#7657E8] shadow-[0_15px_45px_rgba(118,87,232,0.13)] bg-white"
                                    : "border-[#EAE5FF] bg-white shadow-sm hover:shadow-lg"
                                }
                                ${plan.default ? "cursor-default" : "cursor-pointer"}
                            `}
                        >
                            {plan.badge && (
                                <span className="absolute -top-3 right-6 bg-[#7657E8] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                                    {plan.badge}
                                </span>
                            )}

                            <div className="w-12 h-12 rounded-2xl bg-[#F0EBFF] flex items-center justify-center text-[#7657E8] text-xl mb-5">
                                {plan.id === "free" ? (
                                    <FaStar />
                                ) : plan.id === "basic" ? (
                                    <FaGem />
                                ) : (
                                    <FaGem />
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-[#211B3A]">
                                {plan.name}
                            </h2>

                            <p className="text-[#89839D] text-sm mt-3 min-h-[42px] leading-relaxed">
                                {plan.description}
                            </p>

                            <div className="mt-7 flex items-baseline">
                                <span className="text-4xl font-bold text-[#211B3A]">
                                    {plan.price}
                                </span>
                                <span className="text-[#9993A9] text-sm ml-2">
                                    / one time
                                </span>
                            </div>

                            <div className="mt-6 bg-[#F5F1FF] border border-[#EAE5FF] rounded-2xl p-4">
                                <p className="text-[#7657E8] font-bold text-lg">
                                    {plan.credits} AI Credits
                                </p>
                                <p className="text-[#9993A9] text-xs mt-1">
                                    Use credits for AI mock interviews
                                </p>
                            </div>

                            <div className="mt-7 space-y-4 flex-1">
                                {plan.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 text-[#625C77] text-sm"
                                    >
                                        <span className="w-5 h-5 shrink-0 rounded-full bg-[#F0EBFF] flex items-center justify-center mt-[-2px]">
                                            <FaCheck className="text-[#7657E8] text-[10px]" />
                                        </span>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={plan.default || loadingPlan !== null}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayment(plan);
                                }}
                                className={`w-full mt-9 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
                                    ${isSelected
                                        ? "bg-[#7657E8] text-white hover:bg-[#6546D6] shadow-lg shadow-[#7657E8]/20"
                                        : "bg-[#F0EBFF] text-[#7657E8] hover:bg-[#E6DEFF]"
                                    }
                                    ${plan.default ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                `}
                            >
                                {loadingPlan === plan.id
                                    ? "Processing..."
                                    : plan.default
                                        ? "Current Plan"
                                        : isSelected
                                            ? "Proceed to Pay"
                                            : "Choose Plan"
                                }
                            </button>
                        </motion.div>
                    );
                })}

            </div>

            <p className="text-center text-[#9993A9] text-sm mt-12">
                Secure payments powered by Razorpay.
            </p>
        </div>
    );
}

export default Pricing;
