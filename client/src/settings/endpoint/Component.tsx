import { ChangeEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Input from "../../components/Input";
import Modal from "../../components/Modal";
import Select from "../../components/Select";
import Text from "../../components/Text";
import { Info } from "../../components/Icons";
import { Endpoint, NetworkName, NETWORKS } from "../../constants";
import { PgCommon, PgSettings, PgView } from "../../utils/pg";

const EndpointSetting = () => {
  const options = useMemo(
    () => NETWORKS.map((n) => ({ value: n.endpoint, label: n.name })),
    []
  );

  const [value, setValue] = useState<typeof options[number]>();

  useEffect(() => {
    const { dispose } = PgSettings.onDidChangeConnectionEndpoint((endpoint) => {
      setValue(
        options.find(
          (o) => o.value === endpoint || o.label === NetworkName.CUSTOM
        )
      );
    });
    return () => dispose();
  }, [options]);

  return (
    <Select
      options={options}
      value={value}
      onChange={(newValue) => {
        if (newValue?.value === Endpoint.CUSTOM) {
          PgView.setModal(CustomEndpoint);
        } else {
          const newEndpoint = NETWORKS.find(
            (n) => n.name === newValue?.label
          )!.endpoint;
          PgSettings.connection.endpoint = newEndpoint;
        }
      }}
    />
  );
};

const CustomEndpoint = () => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setValue(ev.target.value);
    setError("");
  };

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Add",
        onSubmit: () => {
          // TODO: aelf command set endpoint
          // PgCommand.solana.run(`config set -u ${value}`)
        },
        disabled: !value,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <InputLabel>RPC URL</InputLabel>
        <Input
          autoFocus
          placeholder="https://..."
          value={value}
          onChange={handleChange}
          error={error}
          setError={setError}
          validator={PgCommon.isUrl}
        />

        <InfoText icon={<Info color="info" />}>
          For example, http://localhost:1234/.
        </InfoText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  max-width: 25rem;
`;

const InputLabel = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const InfoText = styled(Text)`
  margin-top: 1rem;
`;

export default EndpointSetting;
