
import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

function Timer({ timeLeft, totalTime }) {
    const percentage = totalTime > 0
        ? Math.min(Math.max((timeLeft / totalTime) * 100, 0), 100)
        : 0

    const isLowTime = timeLeft <= 15

    return (
        <div className="w-24 h-24">
            <CircularProgressbar
                styles={buildStyles({
                    textSize: "25px",
                    pathColor: isLowTime ? "#E65B75" : "#7657E8",
                    textColor: isLowTime ? "#E65B75" : "#211B3A",
                    trailColor: "#F0EBFF",
                    pathTransitionDuration: 0.5
                })}
                value={percentage}
                text={`${timeLeft}s`}
            />
        </div>
    )
}

export default Timer
