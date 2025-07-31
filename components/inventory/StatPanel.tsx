'use client'

import { useState } from 'react'

export default function StatPanel() {
    const [str, setStr] = useState(20)
    const [int, setInt] = useState(20)
    const [available, setAvailable] = useState(333)
    const baseSTR = 20
    const baseINT = 20
    const phyBalance = Math.round(50 + (str - baseSTR) * 1.5)
    const magBalance = Math.round(50 + (int - baseINT) * 1.5)


    const increaseStr = () => {
        if (available > 0) {
            setStr(prev => prev + 1)
            setAvailable(prev => prev - 1)
        }
    }

    const increaseInt = () => {
        if (available > 0) {
            setInt(prev => prev + 1)
            setAvailable(prev => prev - 1)
        }
    }

    return (
        <div className="stat-panel">
            <div className="stat-header">
                <span>Stat Point:</span> <strong>{available}</strong>
            </div>
            <div className="stat-attributes">
                <div className="stat-row">
                    <span>STR</span>
                    <strong>{str}</strong>
                    <button onClick={increaseStr} disabled={available <= 0}>+</button>
                </div>
                <div className="stat-row">
                    <span>INT</span>
                    <strong>{int}</strong>
                    <button onClick={increaseInt} disabled={available <= 0}>+</button>
                </div>
            </div>

            <div className="stat-box">
                <div className="row">
                    <span>HP:</span> <span>{str * 100}</span>
                    <span>MP:</span> <span>{int * 120}</span>
                </div>
                <div className="row">
                    <span>Phy. atk:</span> <span>{str * 5} ~ {str * 7}</span>
                    <span>Mag. atk:</span> <span>{int * 10} ~ {int * 12}</span>
                </div>
                <div className="row">
                    <span>Phy. def:</span> <span>{str * 2}</span>
                    <span>Mag. def:</span> <span>{int * 2}</span>
                </div>
                <div className="row">
                    <span>Phy. bal.</span><span>{phyBalance}%</span>
                    <span>Mag. bal.</span><span>{magBalance}%</span>
                </div>
                <div className="row">
                    <span>Hit ratio:</span> <span>{str * 2}</span>
                    <span>Parry ratio:</span> <span>{int * 2}</span>
                </div>
            </div>

            <div className="job-box">
                <div>Job alias: &lt;Nothing&gt;</div>
                <div>Job level: &lt;Nothing&gt;</div>
                <div className="job-exp">
                    <div className="bar">
                        <div className="fill" style={{ width: '0%' }}></div>
                    </div>
                    <div>0%</div>
                </div>
            </div>
        </div>
    )
}