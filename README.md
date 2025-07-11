# config-ui

Config UI is a web application responsible for managing all configurations  of the Map Colonies project. The application allows users to create configurations based on Schemas, view them in a table, create new configurations, roll back to existing ones, and create new configurations from existing ones.

## Features

- **Presenting Configs Table**: View all configurations in a tabular format.
- **Creating New Configs**: Create new JSON configurations using specific JSON schemas, leveraging the Monaco editor for writing the config and AJV for validation.
- **Reference Existing Configs**: Reference existing configurations in new ones using the following snippet:
  ```json
  "$ref": {"configName": "", "version": "latest", "schemaId": ""}
  ```
- **Rollback and Versioning**: Rollback to existing configurations or create new versions from them. The differences between the original and modified configurations are displayed using the Monaco diff editor.
- **View Config**: Display all metadata and the configuration itself.
- **View Schemas**: Display all schemas in a tree view.
- **View Specific Schema**: View specific schemas in Monaco editor with the ability to toggle the schema to deference mode.

## Technologies Used

- **Vite**: For fast build and development setup.
- **React**: For building the user interface.
- **Monaco Editor**: For writing and displaying JSON configurations.
- **MUI**: For Material-UI components.
- **Zod**: For schema validation.
- **AJV**: For JSON schema validation.

## Installation

**Prerequisites**

Before you begin, make sure you have a local instance of [Config Server](https://github.com/MapColonies/config-server) running, which this application relies on for backend services.

To install and set up the project locally, follow these steps:

1. **Clone the repository**:
   ```sh
   git clone git@github.com:MapColonies/config-ui.git
   ```
2. **Navigate to the project directory**:
   ```sh
   cd config-ui
   ```
3. **Install dependencies**:
   ```sh
   npm install
   ```

4. **Configure Proxy in Vite**

   After setting up the Config Server, update the `vite.config.ts` to include a [proxy configuration](https://vitejs.dev/config/server-options#server-proxy) that routes requests to your local Config Server instance.

5. **Run the application**:
   ```sh
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:5173` to see the application running.

## Usage

Once the application is set up and running:

1. **View Configs**: Navigate to the configs table to view all configurations.
2. **Create Configs**: Use the "Create New Config" button to create a new configuration using a specific JSON schema.
3. **Reference Configs**: Use the `$ref` snippet to reference existing configurations in new ones.
4. **Rollback/Versioning**: Use the rollback and versioning features to manage configurations. The differences will be displayed using the Monaco diff editor.
5. **View Schemas**: Navigate to the schema tree view to see all available schemas.
6. **View Specific Schema**: Use the Monaco editor to view and toggle schemas to deference mode.

## License

This project is licensed under the MIT License. See the LICENSE file for more information.
