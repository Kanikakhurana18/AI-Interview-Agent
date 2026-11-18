
import React, { useState } from "react";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Pricing() {
    const navigate = useNavigate();

    const [selectedPlan, setSelectedPlan] = useState("free");
    const [loadingPlan, setLoadingPlan] = useState(null);
    const dispatch= useDispatch()

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "₹0",
            credits: 100,
            description: "Perfect for beginners starting interview preparation.",
            features: [
                "100 AI Interview Credits",
                "Basic Performance Report",
                "Voice Interview Access",
                "Limited History Tracking"
            ],
            default: true,
        },
        {
            id: "basic",
            name: "Starter Pack",
            price: "₹100",
            amount: 10000,
            credits: 500,
            description: "Great for focused practice and skill improvement.",
            features: [
                "500 AI Interview Credits",
                "Detailed Feedback",
                "Performance Analytics",
                "Full Interview History"
            ],
        },
        {
            id: "pro",
            name: "Pro Pack",
            price: "₹1000",
            amount: 100000,
            credits: 1000,
            description: "Best value for serious job preparation.",
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
                name: "InterviewAI",
                description: `${plan.name} - ${plan.credits} Credits`,
                order_id: order.id,

                handler: async function (response) {
                    const verifyPayment = await axios.post(serverUrl+ "/api/payment/verify", response, {withCredentials:true})
                    dispatch(setUserData(verifyPayment.data.user))

                    alert("Payemnt Succesful Credits Added!")
                    navigate("/")
                    setLoadingPlan(null);
                },

                modal: {
                    ondismiss: () => setLoadingPlan(null)
                },

                theme: {
                    color: "#10b981"
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", function (response) {
                console.log("Payment failed:", response.error);
                setLoadingPlan(null);
            });

            rzp.open();

        } catch (error) {
            console.error(
                "Payment Error:",
                error.response?.data || error.message
            );
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 py-16 px-6">

            <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
                <button
                    onClick={() => navigate("/")}
                    className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition"
                >
                    <FaArrowLeft className="text-gray-600" />
                </button>

                <div className="text-center w-full">
                    <h1 className="text-4xl font-bold text-gray-800">
                        Choose Your Plan
                    </h1>
                    <p className="text-gray-500 mt-3 text-lg">
                        Flexible pricing to match your interview preparation goals.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                        <motion.div
                            key={plan.id}
                            whileHover={!plan.default ? { scale: 1.03 } : {}}
                            onClick={() => {
                                if (!plan.default) setSelectedPlan(plan.id);
                            }}
                            className={`relative rounded-3xl p-8 transition-all duration-300 border
                                ${isSelected
                                    ? "border-emerald-600 shadow-2xl bg-white"
                                    : "border-gray-200 bg-white shadow-md"
                                }
                                ${plan.default ? "cursor-default" : "cursor-pointer"}
                            `}
                        >
                            {plan.badge && (
                                <span className="absolute -top-3 right-6 bg-emerald-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                                    {plan.badge}
                                </span>
                            )}

                            <h2 className="text-2xl font-bold text-gray-800">
                                {plan.name}
                            </h2>

                            <p className="text-gray-500 text-sm mt-3 min-h-10">
                                {plan.description}
                            </p>

                            <div className="mt-6">
                                <span className="text-4xl font-bold text-gray-900">
                                    {plan.price}
                                </span>
                                <span className="text-gray-500 text-sm ml-2">
                                    / one time
                                </span>
                            </div>

                            <div className="mt-4 bg-emerald-50 text-emerald-700 rounded-xl p-3">
                                <p className="font-semibold text-sm">
                                    {plan.credits} AI Credits
                                </p>
                            </div>

                            <div className="mt-7 space-y-4">
                                {plan.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 text-gray-600 text-sm"
                                    >
                                        <FaCheck className="text-emerald-600" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={plan.default || loadingPlan !== null}
                                onClick={() => handlePayment(plan)}
                                className={`w-full mt-8 py-3 rounded-xl font-semibold transition
                                    ${isSelected
                                        ? "bg-emerald-600 text-white"
                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    }
                                    ${plan.default ? "opacity-70 cursor-not-allowed" : ""}
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
        </div>
    );
}

export default Pricing;
