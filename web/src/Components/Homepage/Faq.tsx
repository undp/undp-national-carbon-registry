import React, { useState } from 'react';
import './Dashboard.scss';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({ 0: true }); 

  const faqData = [
    {
      question: "What is a National Carbon Registry?",
      answer: "A National Carbon Registry is a secure digital platform used by governments to track, manage, and regulate carbon credits within their national carbon markets."
    },
    {
      question: "How does a government adopt a National Carbon Registry?",
      answer: ""
    },
    {
      question: "If we use the open-source code, does that mean all data on the Registry is open?",
      answer: ""
    },
    {
      question: "Will the UNDP own and manage my country's National Carbon Registry?",
      answer: ""
    },
    {
      question: "What technical assistance can UNDP provide?",
      answer: ""
    },
    {
      question: "What if the Registry features do not work for my country?",
      answer: ""
    },
    {
      question: "Where will the data hosted?",
      answer: ""
    },
    {
      question: "Is the source code free to use?",
      answer: ""
    },
    {
      question: "Will contributing code back to GitHub risk the National Registry's cybersecurity?",
      answer: ""
    }
  ];

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="faq-container">
      <h2 className="faq-title">FAQ</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <button 
              className={`faq-question ${openItems[index] ? 'active' : ''}`}
              onClick={() => toggleItem(index)}
            >
                <span className={`chevron ${openItems[index] ? 'rotated' : ''}`}>
                ▼
              </span>
              <span className="question-text">{item.question}</span>
              
            </button>
            {openItems[index] && item.answer && (
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;