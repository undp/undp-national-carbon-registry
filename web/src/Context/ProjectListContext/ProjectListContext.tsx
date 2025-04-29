import React, { createContext, useContext, useState } from "react";

export const ProjectListContext = createContext<{
  projectList: any[];
  addProject: (project: any) => void;
  addProjects: (projects: any[]) => void;
  getProjects: () => any;
}>({
  projectList: [],
  addProject: (project: any) => {},
  addProjects: (projects: any[]) => {},
  getProjects: () => {},
});

export const ProjectListContextProvider = ({
  children,
}: React.PropsWithChildren) => {

  const [projectList, setProjectList] = useState<any[]>([]);

  const addProject =  (project: any) => {
    setProjectList((prev) => ([project, ...prev]))
  }

  const addProjects = (projects: any[]) => {
    setProjectList(projects)
  }

  const getProjects = () => {
    return projectList
  }

  return (
    <ProjectListContext.Provider
      value={{
        projectList,
        addProject,
        addProjects,
        getProjects,
      }}
    >
      {children}
    </ProjectListContext.Provider>
  );
};

export const useProjectListContext = () => {
  return useContext(ProjectListContext);
};
