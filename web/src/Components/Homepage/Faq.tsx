import React, { useState } from "react";
import "./Dashboard.scss";
import { ChevronDown } from "react-bootstrap-icons";
import {Envelope} from "react-bootstrap-icons";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="faq-container">
      <h2 className="header-title">Frequently Asked Questions</h2>
      <div className="faq-list">
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 0 ? "active" : ""}`}
            onClick={() => toggleItem(0)}
          >
            <span className={`chevron ${openIndex === 0 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              What is a National Carbon Registry?
            </span>
          </button>
          {openIndex === 0 && (
            <div className="faq-answer">
              <p>
                A National Carbon Registry is a secure digital platform used by
                governments to track, manage, and regulate carbon credits within
                their national carbon markets.
              </p>
            </div>
          )}
        </div>

        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 1 ? "active" : ""}`}
            onClick={() => toggleItem(1)}
          >
            <span className={`chevron ${openIndex === 1 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              How does a government adopt a National Carbon Registry?
            </span>
          </button>
          {openIndex === 1 && (
            <div className="faq-answer">
              <p>
                Governments can adopt and customize the open-source National
                Carbon Registry to meet their specific needs. By building on
                UNDP's open-source codebase, countries can reduce development
                time and costs by up to 70%.
              </p>
              <p>
                To implement the Registry nationally, countries should have:
              </p>
              <ul className="faqList">
                <li>A defined Carbon Market Framework</li>
                <li>
                  A full-stack digital team, with expertise in:
                  <ul className="faqSubList">
                    <li>UX/UI design</li>
                    <li>Backend and frontend development</li>
                    <li>DevOps and system administration</li>
                    <li>Cybersecurity</li>
                  </ul>
                </li>
                <li>
                  Essential IT infrastructure, including:
                  <ul className="faqSubList">
                    <li>Server space (cloud, local, or blockchain-based)</li>
                    <li>SSL/TLS certificates for encrypted communication</li>
                    <li>A secure domain name (e.g., HTTPS with trusted CA)</li>
                    <li>Firewalls and intrusion detection systems</li>
                    <li>Role-based access control (RBAC)</li>
                    <li>Data encryption (at rest and in transit)</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Backup and disaster recovery protocols</li>
                  </ul>
                </li>
                <li>
                  An Implementation Task Force: A cross-functional team of
                  policy and IT representatives to lead deployment
                </li>
                <li>A designated Project Owner</li>
                <li>
                  A long-term maintenance plan, with a dedicated IT budget
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 2 ? "active" : ""}`}
            onClick={() => toggleItem(2)}
          >
            <span className={`chevron ${openIndex === 2 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              If we use the open-source code, does that mean all data on the
              Registry is open?
            </span>
          </button>
          {openIndex === 2 && (
            <div className="faq-answer">
              <p>
                No. The open-source code is publicly available, as a starting
                point to help countries adapt and build their own national
                Registries. All country-specific registries and data, once
                built, are hosted and secured by each government. Each country
                is responsible for managing its own system in line with national
                data protection laws. Data access and sharing are entirely up to
                each government.
              </p>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 3 ? "active" : ""}`}
            onClick={() => toggleItem(3)}
          >
            <span className={`chevron ${openIndex === 3 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              Will the UNDP own and manage my country's National Carbon
              Registry?
            </span>
          </button>
          {openIndex === 3 && (
            <div className="faq-answer">
              <p>
                No. Each National Carbon Registry is fully sovereign. Each
                government is responsible for the ownership, hosting, and
                management of its own registry. UNDP's role is to support
                countries with knowledge transfer and technical assistance.
              </p>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 4 ? "active" : ""}`}
            onClick={() => toggleItem(4)}
          >
            <span className={`chevron ${openIndex === 4 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              What technical assistance can UNDP provide?
            </span>
          </button>
          {openIndex === 4 && (
            <div className="faq-answer">
              <p>
                Through your local UNDP country office, the UNDP Digital for
                Planet team may offer support to governments in the following
                areas (subject to availability and agreement):
              </p>
              <ul className="faqList">
                <li>
                  <b>Resources & Templates:</b> Access to standard workplans,
                  workflows, and configuration tools to support deployment.
                </li>
                <li>
                  <b>International Expertise:</b> Guidance from global experts
                  in product development, IT, carbon markets, and policy.
                </li>
                <li>
                  <b>Community of Practice:</b> Ongoing access to a global
                  network for collaboration, troubleshooting, and shared
                  learning.
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 5 ? "active" : ""}`}
            onClick={() => toggleItem(5)}
          >
            <span className={`chevron ${openIndex === 5 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              What if the Registry features do not work for my country?
            </span>
          </button>
          {openIndex === 5 && (
            <div className="faq-answer">
              <p>
                The Registry is designed to be fully customizable. Countries
                typically start each process by defining their countries’ needs
                and determining what needs to be changed from the demo system.
                Countries have already adapted the platform to fit a wide
                variety of contexts, including:
              </p>
              <ul className="faqList">
                <li>
                  The process flow of project registration, authorisation,
                  monitoring, issuance
                </li>
                <li>User roles and permissions</li>
                <li>Approval authorities</li>
                <li>Documentation requirements and forms</li>
                <li>Data requirements (data fields)</li>
                <li>Serial number formatting</li>
                <li>API Integration</li>
                <li>Types of carbon market mechanisms supported</li>
                <li>Advanced AI functionality </li>
                <li>Data Hosting & Security protocols</li>
              </ul>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 6 ? "active" : ""}`}
            onClick={() => toggleItem(6)}
          >
            <span className={`chevron ${openIndex === 6 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              Where will the data hosted?
            </span>
          </button>
          {openIndex === 6 && (
            <div className="faq-answer">
              <p>
                Countries are responsible for hosting and maintaining their
                Registry. Three primary hosting options countries have
                considered include:
              </p>
              <ul className="faqList">
                <li>
                  <p>
                    <b>Cloud Hosting</b>
                  </p>
                  <span>
                    Offers scalability, integrated security, and ease of backup
                    and maintenance. Hosting on AWS (via a government-owned
                    account) allows countries to fully leverage QLDB with
                    minimal configuration changes.
                  </span>
                </li>
                <li>
                  <p>
                    <b>Local Hosting</b>
                  </p>
                  <span>
                    Countries can choose to install the software on
                    government-managed servers or preferred cloud platforms to
                    maintain full control over data, access, and security. Local
                    IT teams will be responsible for ongoing maintenance,
                    configuration, and backups.
                  </span>
                </li>
                <li>
                  <p>
                    <b>Blockchain Integration</b>
                  </p>
                  <span>
                    Countries may opt to integrate blockchain-based encryption
                    and distributed storage to enhance security and
                    traceability.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 7 ? "active" : ""}`}
            onClick={() => toggleItem(7)}
          >
            <span className={`chevron ${openIndex === 7 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              Is the source code free to use?
            </span>
          </button>
          {openIndex === 7 && (
            <div className="faq-answer">
              <p>
                Yes. The Registry is developed by UNDP and licensed under the{" "}
                <b>GNU Affero General Public License (AGPL-3.0)</b>. This
                license allows:
              </p>
              <ul className="faqList">
                <li>Free use, customization, and redistribution</li>
                <li>
                  Mandatory publication of any modifications to a public GitHub
                  repository
                </li>
                <li>No relicensing under more restrictive term</li>
              </ul>
              <span>
                <b>Note:</b> If your team adapts the code, you are required to publish
                relevant updated code as a branch on GitHub in compliance with
                the license (after removing all sensitive, identifiable
                information).
              </span>
              <p> 📩 Let us know if you’re using the tool: <a href="mailto:digital4planet@undp.org">digital4planet@undp.org</a></p>
            </div>
          )}
        </div>
        <div className="faq-item">
          <button
            className={`faq-question ${openIndex === 8 ? "active" : ""}`}
            onClick={() => toggleItem(8)}
          >
            <span className={`chevron ${openIndex === 8 ? "rotated" : ""}`}>
              <ChevronDown />
            </span>
            <span className="question-text">
              Will contributing code back to GitHub risk the National Registry’s cybersecurity?
            </span>
          </button>
          {openIndex === 8 && (
            <div className="faq-answer">
              <p>
                No. Project teams can share new feature improvements without disclosing sensitive details, such as by removing or anonymising all sensitive information including: 
              </p>
              <ul className="faqList">
                <li>Domain names</li>
                <li>
                  Port numbers
                </li>
                <li>API endpoints</li>
                <li>Usernames</li>
                <li>Database names, locations</li>
                <li>And any other sensitive information</li>
              </ul>
              <span>
                This ensures transparency in software development while protecting national infrastructure.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
