import { ChangeEvent, useLayoutEffect, useState } from "react";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgAElfContractTemplates, PgExplorer } from "../../../../../utils/pg";
import Select from "../../../../../components/Select";

export const NewWorkspace = () => {
  // Handle user input
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [templates, setTemplates] = useState<
    { value: string; label: string }[]
  >([]);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
    setError("");
  };

  const newWorkspace = async () => {
    await PgAElfContractTemplates.import(selected?.value!, name);
  };

  useLayoutEffect(() => {
    (async () => {
      const names = await PgAElfContractTemplates.getTemplateNames();
      setTemplates(names.map((i) => ({ value: i, label: i })));
    })();

    return () => {
      setTemplates([]);
    };
  }, []);

  return (
    <Modal
      buttonProps={{
        text: "Create",
        onSubmit: newWorkspace,
        disabled: !name || !selected,
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Project name</MainText>
          <Input
            autoFocus
            onChange={handleChange}
            value={name}
            error={error}
            setError={setError}
            validator={PgExplorer.isWorkspaceNameValid}
            placeholder="my project..."
          />
        </WorkspaceNameWrapper>

        <FrameworkSectionWrapper>
          <MainText>Choose a template</MainText>
          <FrameworksWrapper>
            <Select
              menuPosition="fixed"
              options={templates}
              value={selected}
              onChange={(e) => {
                setSelected(e);
              }}
            />
          </FrameworksWrapper>
        </FrameworkSectionWrapper>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WorkspaceNameWrapper = styled.div``;

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: ${({ theme }) => theme.font.code.size.large};
`;

const FrameworkSectionWrapper = styled.div`
  margin: 1rem 0 0.5rem 0;
`;

const FrameworksWrapper = styled.div`
  display: flex;
  gap: 2rem;
`;
