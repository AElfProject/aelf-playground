import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  [
    "src/Protobuf/contract/hello_world_contract.proto",
    require("./src/Protobuf/contract/hello_world_contract.proto"),
  ],
  [
    "src/Protobuf/message/authority_info.proto",
    require("./src/Protobuf/message/authority_info.proto"),
  ],
  [
    "src/Protobuf/reference/acs12.proto",
    require("./src/Protobuf/reference/acs12.proto"),
  ],
  ["src/HelloWorld.cs", require("./src/HelloWorld.cs")],
  ["src/HelloWorld.csproj", require("./src/HelloWorld.csproj")],
  ["src/HelloWorldState.cs", require("./src/HelloWorldState.cs")],
];
