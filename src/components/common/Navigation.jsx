// src/components/common/Navigation.jsx

import React, { useState } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

// 로고 이미지 임포트
import mainLogo from '../../assets/images/로고.png';

const Navigation = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 } 
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const buildingData = [
    { name: '광개토관', color: '#DC143C' },
    { name: '충무관', color: "#003cff" },
    { name: '대양AI센터', color: '#FFCC00' },
    { name: '집현관', color: '#34C759' },
    { name: '학생회관', color: "#b450f2" }
  ];

  // 메뉴 클릭 시 해당 경로로 이동하고 드롭다운을 닫는 함수
  const handleNavClick = (path) => {
    navigate(path);
    setActiveMenu(null);
  };

  return (
    <Navbar fixed="top" className="apple-navbar">
      <Container className="d-flex justify-content-between align-items-center">
        {/* 로고 클릭 시 홈으로 */}
        <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
          <img 
            src={mainLogo} 
            alt="Sejong AI Energy Logo" 
            className="nav-main-logo" 
          />
        </Navbar.Brand>

        <Nav className="mx-auto nav-gap-custom">
          {/* 1. 비교 메뉴: 클릭 시 전체 비교 화면으로 이동 */}
          <div 
            className="nav-dropdown-wrapper" 
            onMouseEnter={() => setActiveMenu('compare')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <span 
              className="nav-custom-link clickable" 
              onClick={() => handleNavClick('/dashboard1')}
            >
              비교
            </span>
            
            <AnimatePresence>
              {activeMenu === 'compare' && (
                <motion.div 
                  className="apple-mega-menu-simple"
                  variants={menuVariants}
                  initial="hidden" animate="visible" exit="exit"
                >
                  <div className="mega-menu-inner">
                    <ul className="mega-menu-list-centered">
                      <motion.li 
                        variants={itemVariants}
                        className="mega-menu-item-custom large-text"
                        onClick={() => handleNavClick('/dashboard1')}
                      >
                        캠퍼스 전체 비교 분석
                      </motion.li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* 2. 개별 메뉴: 클릭 시 지도 선택 화면(MainSection2)으로 이동 */}
          <div 
            className="nav-dropdown-wrapper" 
            onMouseEnter={() => setActiveMenu('individual')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <span 
              className="nav-custom-link clickable" 
              onClick={() => handleNavClick('/individual-select')}
            >
              개별
            </span>
            
            <AnimatePresence>
              {activeMenu === 'individual' && (
                <motion.div 
                  className="apple-mega-menu-simple"
                  variants={menuVariants}
                  initial="hidden" animate="visible" exit="exit"
                >
                  <div className="mega-menu-inner">
                    <motion.p className="mega-menu-header" variants={itemVariants}>
                      건물별 상세 데이터
                    </motion.p>
                    <ul className="mega-menu-list-centered">
                      {buildingData.map((bldg, index) => (
                        <React.Fragment key={bldg.name}>
                          <motion.li 
                            variants={itemVariants}
                            className="mega-menu-item-custom"
                            style={{ color: bldg.color, fontWeight: '700' }}
                            onClick={() => handleNavClick(`/individual/${bldg.name}`)}
                          >
                            {bldg.name}
                          </motion.li>
                          {index !== buildingData.length - 1 && (
                            <motion.div className="mega-item-divider" variants={itemVariants} />
                          )}
                        </React.Fragment>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. 종합 메뉴: 클릭 시 종합 전력 분석 화면으로 이동 */}
          <div 
            className="nav-dropdown-wrapper" 
            onMouseEnter={() => setActiveMenu('total')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <span 
              className="nav-custom-link clickable" 
              onClick={() => handleNavClick('/dashboard')}
            >
              종합
            </span>
            
            <AnimatePresence>
              {activeMenu === 'total' && (
                <motion.div 
                  className="apple-mega-menu-simple"
                  variants={menuVariants}
                  initial="hidden" animate="visible" exit="exit"
                >
                  <div className="mega-menu-inner">
                    <ul className="mega-menu-list-centered">
                      <motion.li 
                        variants={itemVariants}
                        className="mega-menu-item-custom large-text"
                        onClick={() => handleNavClick('/dashboard')}
                      >
                        종합 전력 수요 대시보드
                      </motion.li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <span 
            className="nav-custom-link"
            style={{ cursor: 'default', color: '#a1a1a6' }}
            onMouseEnter={() => setActiveMenu(null)}
          >
            etc
          </span>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Navigation;