import React, { useState } from 'react';
import './request.css';

const RequestPage: React.FC = () => {
    const [date, setDate] = useState('');
    const [timePeriod, setTimePeriod] = useState('full');
    const [error, setError] = useState('');
    const [requests, setRequests] = useState<{ date: string; timePeriod: string }[]>([]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const selectedDate = new Date(date);
        const currentDate = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000; //get a day in ms to perform math

        if (Math.abs(selectedDate.getTime() - currentDate.getTime()) < oneDayInMs) {
            setError('Work from home requests must be made at least one day in advance.');
        } else {
            setError('');
            setRequests([...requests, { date, timePeriod }]);
            setDate('');
            setTimePeriod('full');
        }
    };

    return (
        <div className="request-page">
            <h1>Work From Home Request</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="date">Date of Work From Home:</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="timePeriod">Time Period:</label>
                    <select
                        id="timePeriod"
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        required
                    >
                        <option value="am">AM</option>
                        <option value="pm">PM</option>
                        <option value="full">Full Day</option>
                    </select>
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Submit Request</button>
            </form>
            <h2>Submitted Requests</h2> 
            {/* TODO: get submitted requests from database and place here */}
            <ul>
                {requests.map((request, index) => (
                    <li key={index}>
                        {request.date} - {request.timePeriod}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RequestPage;