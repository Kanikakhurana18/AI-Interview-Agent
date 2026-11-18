import React, { useEffect, useRef, useState } from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react";
import {FaMicrophone, FaMicrophoneSlash} from "react-icons/fa"
import axios from 'axios';
import { serverUrl } from '../App';
import { BsArrowRight } from 'react-icons/bs';

function Step2Interview({interviewData,onFinish}) {
  const {interviewId, questions, userName}= interviewData;
  const [isIntroPhase, setIsIntroPhase]= useState(true);
  const [isMicOn, setIsMicOn]= useState(true);
  const recognitionRef= useRef(null)
  const [isAIPlaying, setIsAIPlaying]= useState(false)
  const [currentIdx, setCurrentIdx]= useState(0)
  const [answer, setAnswer]= useState("")
  const [feedback, setFeedback]= useState("")
  const [timeLeft, setTimeLeft]= useState(
    questions[0]?.timeLimit || 60
  );
  const [selectedVoice, setSelectedVoice]= useState(null)
  const[ isSubmitting, setIsSubmitting] = useState(false)
  const [voiceGender, setVoiceGender] =useState("female")
  const [subtitle, setSubtitle]= useState("");
  const videoRef = useRef(null);
  const currentQuestion = questions[currentIdx]

  useEffect(()=>{
    const loadVoices= ()=>{
      const voices = window.speechSynthesis.getVoices();
      if(!voices.length) return;
      
      //Female voice
      const femaleVoice= voices.find(v=>
        v.name.toLowerCase().includes("heera") ||
        v.name.toLowerCase().includes("zira") || 
        v.name.toLowerCase().includes("female") 
      )

      if(femaleVoice){
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }
      
      //Male voice
      const maleVoice= voices.find(v=>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("male") || 
        v.name.toLowerCase().includes("ravi")
      )
      if(maleVoice){
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      //Fallback: first voice(female)
      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged= loadVoices;

  },[])

  const videoSource= voiceGender==="female" ? femaleVideo : maleVideo;

  //speak function
 const speak = (text) => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !selectedVoice) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const humanText = text
      .replace(/,/g, ",...")
      .replace(/\./g, ". ...");

    const utterance = new SpeechSynthesisUtterance(humanText);

    utterance.voice = selectedVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsAIPlaying(true);
      stopMic();
      videoRef.current?.play().catch(() => {});
    };

    utterance.onend = () => {
      videoRef.current?.pause();
      videoRef.current.currentTime = 0;
      setIsAIPlaying(false);

      setTimeout(() => {
        setSubtitle("");
        resolve();
      }, 300);
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsAIPlaying(false);
      resolve();
    };

    setSubtitle(text);
    window.speechSynthesis.speak(utterance);
  });
};


  useEffect(() => {
  if (!selectedVoice) return;

  const runIntro = async () => {
    if (isIntroPhase) {

      await speak(`Hello ${userName}, welcome to the AI Smart Interview. It's great to have you here. I hope you're ready to showcase your skills and feeling confident and ready.`);

      await speak(`I'll ask you a series of questions. Just answer them to the best of your ability. You can take your time, and remember, there's no rush. Let's begin with the first question.`);

      setIsIntroPhase(false);

    } else if (currentQuestion) {

      await new Promise(r => setTimeout(r, 800));

      if (currentIdx === questions.length - 1) {
        await speak("Alright, this might be a bit challenging.");
      }

      await speak(`Here's your question: ${currentQuestion.question}`);

      if(isMicOn){
        startMic();
      }
    }
  };

  runIntro();

}, [selectedVoice, isIntroPhase, currentIdx]);
   

  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return;
    if(isSubmitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);

  },[isIntroPhase,currentIdx, isSubmitting])


  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech recognition not supported.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript.trim();

    setAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
  };

  recognition.onerror = (event) => {
    console.error("Microphone error:", event.error);
  };

  recognitionRef.current = recognition;

  return () => {
    recognition.stop();
    recognitionRef.current = null;
  };
}, []);

  const startMic = () => {
    if(recognitionRef.current && !isAIPlaying) {
      try{
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  const stopMic = () => {
    if(recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleMic = () => {
    if(isMicOn) {
      stopMic();
     } else {
      startMic();
     }
     setIsMicOn(!isMicOn);
  };


  const submitAnswer = async () => {
    if(isSubmitting) return;
    stopMic();
    setIsSubmitting(true);

    try{
      const result = await axios.post(serverUrl + "/api/interview/submit-answers", {
        interviewId,
        questionIndex: currentIdx,
        answer,
        timeTaken: (currentQuestion.timeLimit - timeLeft)
      }, {withCredentials: true});

      setFeedback(result.data.feedback);
      speak(result.data.feedback);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting answer:", error);
      setIsSubmitting(false);
    }
  }


  const handleNext= async () => {
    setAnswer("");
    setFeedback("");

    if(currentIdx+1>= questions.length){
      finishInterview();
      return;
    }
    await speak(" Alright, let's move on to the next question.");
    if (isMicOn) {
  startMic();
}

    setCurrentIdx(currentIdx + 1);
    setTimeout(()=>{
      if(isMicOn) startMic();
    },500);
  }


  const finishInterview= async () => {
    stopMic();
    setIsMicOn(false);
    try{
      const result = await axios.post(serverUrl + "/api/interview/finish", {
        interviewId
      }, {withCredentials: true});

      onFinish(result.data);
    } catch (error) {
      console.error("Error finishing interview:", error);
    }
  }

  useEffect(() => {
  if (isIntroPhase || !currentQuestion) return;

  if (timeLeft === 0 && !feedback && !isSubmitting) {
    submitAnswer();
  }
}, [timeLeft, isIntroPhase, feedback, isSubmitting]);

  useEffect(()=>{
    return () => {
      if(recognitionRef.current){
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  },[]); 


  useEffect(() => {
  setTimeLeft(currentQuestion?.timeLimit || 60);
}, [currentIdx, currentQuestion?.timeLimit]);



  return (
    <div className='min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden'>

        <div className='w-full lg:w-[35%] bg-white fle flex-colitems-center p-6 space-y-6 border-r border-gray-200'>
          
        {/* video section */}
          <div className='w-full max-w-md rounded-2xl overflow-hidden shadow-xl'>
          <video 
          src={videoSource}
          key={videoSource}
          ref={videoRef}
          muted 
          playsInline 
          preload='auto' 
          className='w-full h-auto object-cover'
          />
          </div>

          {/* subtitle */}
          {subtitle && (
            <div className='w-full max-w-md bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-200 '>
              <p className='text-sm text-gray-700 sm:text-base font-medium text-center leading-relaxed'>{subtitle}</p>
            </div>
          )}

          {/* timer area */}
          <div className='w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-500'>
                Interview Status
              </span>
              {isAIPlaying && <span className='text-sm font-semibold text-emerald-600'>
                {isAIPlaying ? "AI is speaking..." : "AI is idle"}
              </span>}
            </div>

            <div className='h-px bg-gray-200'></div>

            <div className='flex justify-center'>
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60}/>
            </div>

            <div className='h-px bg-gray-200'></div>

            <div className='grid grid-cols-2 gap-6 text-center'>
              <div>
                <span className='text-2xl font-bold text-emerald-600'>{currentIdx + 1}</span>
                <span className='text-xs text-gray-400'>Current Question</span>
              </div>

              <div>
                <span className='text-2xl font-bold text-emerald-600'>{questions.length}</span>
                <span className='text-xs text-gray-400'>Total Questions</span>
              </div>
            </div>

          </div>

           </div>


          {/* text section */}
          <div className='flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative'>

            <h2 className='text-xl sm:text-2xl font-bold text-emerald-600 mb-6'>
              AI Smart Interview
            </h2>

            {!isIntroPhase && <div className='relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm'>
              <p className='text-xs sm:text-sm text-gray-400 mb-2'>
                Question {currentIdx + 1} of {questions.length}
              </p>

              <div className='text-base sm:text-lg font-semibold text-gray-800 leading-relaxed'>{currentQuestion?.question}</div>
            </div>}

            <textarea
            placeholder='Type your answer here...'
            onChange={(e)=>setAnswer(e.target.value)}
            value={answer} 
            className='flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-gray-800'/>

            {!feedback ? (<div className='flex items-center gap-4 mt-6'>
              <motion.button 
              whileTap={{scale:0.9}}
              onClick={toggleMic}
              className='w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg'>
                {isMicOn?<FaMicrophone size={20}/>:<FaMicrophoneSlash size={20}/>}
              </motion.button>

              <motion.button 
              whileTap={{scale:0.95}}
              onClick={submitAnswer}
              disabled={isSubmitting}
              className='flex-1 bg-linear-to-br from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500'>
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </motion.button>
            </div>) :(
              <motion.div
              initial={{ opacity: 0}}
              animate={{ opacity: 1}} 
              className='mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm'>
                <p className='text-emerald-700 font-medium mb-4'>{feedback}</p>

                <button 
                onClick={handleNext}
                className='w-full bg-linear-to-br from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1'>
                  Next Question <BsArrowRight size={18}/>
                </button>
              </motion.div>
            )}

          </div>

       
      </div>
    </div>
  )
}

export default Step2Interview
