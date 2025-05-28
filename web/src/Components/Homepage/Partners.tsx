import React from 'react';
import undpLogo from "../../Assets/Images/undp1.webp";
import EBRD from "../../Assets/Images/EBRD.webp";
import EBRDff from "../../Assets/Images/EBRD.png";
import UNFCCC from "../../Assets/Images/UNFCCC.webp";
import UNFCCCff from "../../Assets/Images/UNFCCC.png";
import IETA from "../../Assets/Images/IETA.webp";
import IETAff from "../../Assets/Images/IETA.png";
import ESA from "../../Assets/Images/ESA.webp";
import ESAff from "../../Assets/Images/ESA.png";
import WBANK from "../../Assets/Images/WBANK.webp";
import WBANKff from "../../Assets/Images/WBANK.png";
import './Dashboard.scss';

const PartnershipBanner = () => {
  return (
    <div className="partnership-banner">
      <div className="banner-content">
        <h2 className="banner-title">Developed in Partnership with Digital for Climate (D4C)</h2>
        <p className="banner-description">
          This software has been developed in partnership with{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              Digital For Climate (D4C)
            </a>
          </strong>. D4C is a collaboration between the{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              European Bank for Reconstruction and Development (EBRD)
            </a>
          </strong>,{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              United Nations Development Program (UNDP)
            </a>
          </strong>,{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              United Nations Framework Convention on Climate Change (UNFCCC)
            </a>
          </strong>,{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              International Emissions Trading Association (IETA)
            </a>
          </strong>,{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              European Space Agency (ESA)
            </a>
          </strong>, and{' '}
          <strong>
            <a href="" target="_blank" rel="noopener noreferrer">
              World Bank Group
            </a>
          </strong>{' '}
          that aims to coordinate respective workflows and create a modular and interoperable end-to-end digital ecosystem for the carbon market.
        </p>
      </div>
      
      <div className="logos-container">
        <div className="logo-item">
          <div className="logo">
            <a href="https://www.ebrd.com/" target="_blank" rel="noopener noreferrer">
              <img src={EBRD} alt="European Bank for Reconstruction and Development" className="logo-img ebrd" />
            </a>
          </div>
        </div>

        <div className="logo-item">
          <div className="logo">
            <a href="https://www.undp.org/" target="_blank" rel="noopener noreferrer">
              <img src={undpLogo} alt="United Nations Development Programme" className="logo-img" />
            </a>
          </div>
        </div>

        <div className="logo-item">
          <div className="logo">
            <a href="https://unfccc.int/" target="_blank" rel="noopener noreferrer">
              <img src={UNFCCC} alt="United Nations Framework Convention on Climate Change" className="logo-img" />
            </a>
          </div>
        </div>

        <div className="logo-item">
          <div className="logo">
            <a href="https://www.ieta.org/" target="_blank" rel="noopener noreferrer">
              <img src={IETA} alt="International Emissions Trading Association" className="logo-img" />
            </a>
          </div>
        </div>

        <div className="logo-item">
          <div className="logo">
            <a href="https://www.esa.int/" target="_blank" rel="noopener noreferrer">
              <img src={ESA} alt="European Space Agency" className="logo-img" />
            </a>
          </div>
        </div>

        <div className="logo-item">
          <div className="logo">
            <a href="https://www.worldbank.org/" target="_blank" rel="noopener noreferrer">
              <img src={WBANK} alt="World Bank Group" className="logo-img" />
            </a>
          </div>
          <div className="logo-text">
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipBanner;