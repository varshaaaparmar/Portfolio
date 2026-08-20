BEGIN TRANSACTION;
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new'
  );
INSERT INTO "contacts" VALUES(1,'Test User','test@example.com','Hello Varsha! This is a test message from the backend.','2026-08-06 14:59:09','new');
CREATE TABLE experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT,
    duration TEXT,
    description TEXT,
    tech TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
INSERT INTO "experiences" VALUES(1,'UptoSkills','Software Developer Intern','Remote · Mar 2026 – Jun 2026','["Enhanced Skillova''s UI, improving reliability for 180 users","Built 2 product card components with React & Node.js","Cut reported interface issues by 12% through targeted debugging","Reduced issue turnaround time by 45% with the dev team"]','HTML,CSS,JS,React,Node.js','2026-08-06 14:59:05');
INSERT INTO "experiences" VALUES(2,'Apponix Technologies','Frontend Developer Intern','Jan 2026 – Feb 2026','["Built product card UI with HTML, CSS & JavaScript","Delivered front-end features using React & Node.js","Translated 2 design layouts into responsive components"]','HTML,CSS,JS,React,Node.js','2026-08-06 14:59:05');
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tech TEXT,
    demo_url TEXT,
    github_url TEXT,
    backend_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
INSERT INTO "projects" VALUES(1,'lms','Brainrot Academy LMS','A complete LMS built with FastAPI and MongoDB — course content, user management and REST APIs, backend and database designed end-to-end.','Python, FastAPI, MongoDB, REST API','https://brainrot-academy-theta.vercel.app','https://github.com/varshaaaparmar','https://brainrot-academy.onrender.com','2026-08-06 14:59:05');
INSERT INTO "projects" VALUES(2,'cards','Product Card Components','A set of production product-card components shipped during internships — reusable, responsive, and wired into React front ends across two live codebases.','React, HTML, CSS, JavaScript',NULL,'https://github.com/varshaaaparmar',NULL,'2026-08-06 14:59:05');
COMMIT;