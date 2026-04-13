import React from 'react';
import { Container } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="apple-footer">
      <Container>
        <div className="footer-content">
          <div className="footer-top">
            <p>본 시스템은 세종대학교 인공지능학과 캡스톤 디자인 프로젝트의 일환으로 개발되었습니다.</p>
          </div>
          <hr className="footer-divider" />
          <div className="footer-bottom">
            <div className="footer-copyright">
              Copyright © 2026 Sejong University AI Dept. All rights reserved.
            </div>
            
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;