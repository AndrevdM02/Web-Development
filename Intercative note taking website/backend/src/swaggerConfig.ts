import { Options } from "swagger-jsdoc";

const swaggerOptions: Options = {
    swaggerDefinition: {
    "openapi": "3.0.3",
    "info": {
      "title": "Library of Alexandria REST API - OpenAPI 3.0",
      "description": "This page documents the API endpoints exposed for the Library of Alexandria \ncollaborative note-writing app available at: [http://192.145.146.90:18226/](http://192.145.146.90:18226/).\n\nThe API is designed as a RESTful API. There is authentication using auth.js tokens to protect endpoints containing sensitive information.",
      "contact": {
        "email": "ludwig.deruyter@gmail.com"
      },
      "license": {
        "name": "Apache 2.0",
        "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
      },
      "version": "1.0.11"
    },
    "externalDocs": {
      "description": "Find out more about Swagger",
      "url": "http://swagger.io"
    },
    "servers": [
      {
        "url": "http://192.145.146.90:18223/"
      }
    ],
    "tags": [
      {
        "name": "Users",
        "description": "Fetch, create and edit Users"
      },
      {
        "name": "Notes",
        "description": "Fetch, create and edit Notes"
      },
      {
        "name": "Shared Notes",
        "description": "Fetch, create and edit Shared Notes. Shared notes keep track of which notes (by note_id) have been shared with which users (by user_id)"
      },
      {
        "name": "Categories",
        "description": "Fetch, create and edit Notes"
      }
    ],
    "paths": {
      "/api/users": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "Get all users",
          "description": "Retrieves all users",
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/users/exists": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Check if user exists",
          "description": "Checks if a user with given username and email exists",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "exists": {
                        "type": "boolean"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/users/{user_id}": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "Get user by ID",
          "description": "Retrieves a user by their ID",
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      },
      "/api/users/new": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Create new user",
          "description": "Creates a new user",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_name": {
                      "type": "string"
                    },
                    "password": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "user_id": {
                        "type": "integer"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/users/delete": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Delete user",
          "description": "Deletes a user",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/users/image": {
        "put": {
          "tags": [
            "Users"
          ],
          "summary": "Update user image",
          "description": "Updates a user's profile image",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_name": {
                      "type": "string"
                    },
                    "image_url": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/users/displayInfo/{user_name}": {
        "get": {
          "tags": [
            "Users"
          ],
          "summary": "Get user display info",
          "description": "Retrieves display information for a user",
          "parameters": [
            {
              "in": "path",
              "name": "user_name",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      },
      "/api/users/update": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Update user info",
          "description": "Updates a user's information",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "user_name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/users/password_update": {
        "post": {
          "tags": [
            "Users"
          ],
          "summary": "Update user password",
          "description": "Updates a user's password",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "password": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/notes": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get all notes",
          "description": "Retrieves all notes for the authenticated user",
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Note"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/{note_id}": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get note by ID",
          "description": "Retrieves a note by its ID",
          "parameters": [
            {
              "in": "path",
              "name": "note_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Note"
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/{user_id}/{name}": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get note by name",
          "description": "Retrieves a note by user ID and note name",
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "name",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Note"
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/{user_id}/{name}/{category}": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get note by name and category",
          "description": "Retrieves a note by user ID, note name, and category",
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "name",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "in": "path",
              "name": "category",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Note"
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/books/{user_id}/{category}": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get notes for books",
          "description": "Retrieves notes for a specific user and category",
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "category",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Note"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/owner/{user_id}": {
        "get": {
          "tags": [
            "Notes"
          ],
          "summary": "Get notes by owner ID",
          "description": "Retrieves all notes for a specific user",
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Note"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/new": {
        "post": {
          "tags": [
            "Notes"
          ],
          "summary": "Create new note",
          "description": "Creates a new note",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "note_name": {
                      "type": "string"
                    },
                    "category": {
                      "type": "integer",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Note"
                  }
                }
              }
            }
          }
        }
      },
      "/api/notes/delete": {
        "post": {
          "tags": [
            "Notes"
          ],
          "summary": "Delete note",
          "description": "Deletes a note",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "note_name": {
                      "type": "string"
                    },
                    "category": {
                      "type": "integer",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/notes/update": {
        "post": {
          "tags": [
            "Notes"
          ],
          "summary": "Update note",
          "description": "Updates a note's name",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "category": {
                      "type": "integer",
                      "nullable": true
                    },
                    "old_name": {
                      "type": "string"
                    },
                    "new_name": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/notes/save": {
        "post": {
          "tags": [
            "Notes"
          ],
          "summary": "Save note content",
          "description": "Saves the content of a note",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "note_id": {
                      "type": "integer"
                    },
                    "content": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/notes/move_note": {
        "post": {
          "tags": [
            "Notes"
          ],
          "summary": "Move note",
          "description": "Moves a note to a different category",
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "note_name": {
                      "type": "string"
                    },
                    "category": {
                      "type": "integer",
                      "nullable": true
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/shared_notes": {
        "get": {
          "summary": "Get all shared notes for a user",
          "description": "Retrieve a list of all notes shared with the user.",
          "tags": [
            "Shared Notes"
          ],
          "parameters": [
            {
              "name": "user_id",
              "in": "query",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the user whose shared notes are being fetched"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/shared_notes/user/{user_id}": {
        "get": {
          "summary": "Get shared notes by user ID",
          "description": "Retrieve a list of shared notes for a specific user.",
          "tags": [
            "Shared Notes"
          ],
          "parameters": [
            {
              "name": "user_id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the user"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/shared_notes/note/{note_id}": {
        "get": {
          "summary": "Get shared notes by note ID",
          "description": "Retrieve shared note details based on the note ID.",
          "tags": [
            "Shared Notes"
          ],
          "parameters": [
            {
              "name": "note_id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the note"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/shared_notes/user/{user_id}/note/{note_id}": {
        "get": {
          "summary": "Get shared note by user ID and note ID",
          "description": "Retrieve shared note details based on both the user ID and note ID.",
          "tags": [
            "Shared Notes"
          ],
          "parameters": [
            {
              "name": "user_id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the user"
            },
            {
              "name": "note_id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              },
              "description": "The ID of the note"
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/shared_notes/new": {
        "post": {
          "summary": "Create a new shared note",
          "description": "Share an existing note with another user.",
          "tags": [
            "Shared Notes"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer",
                      "description": "The ID of the user sharing the note"
                    },
                    "note_id": {
                      "type": "integer",
                      "description": "The ID of the note being shared"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/shared_notes/remove": {
        "post": {
          "summary": "Remove a shared note",
          "description": "Remove a shared note between two users.",
          "tags": [
            "Shared Notes"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer",
                      "description": "The ID of the user who is unsharing the note"
                    },
                    "note_id": {
                      "type": "integer",
                      "description": "The ID of the note being unshared"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SharedNote"
                  }
                }
              }
            }
          }
        }
      },
      "/api/categories": {
        "get": {
          "summary": "Get all categories",
          "description": "Retrieves all categories",
          "tags": [
            "Categories"
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Category"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/categories/{user_id}": {
        "get": {
          "summary": "Get categories by user ID",
          "description": "Retrieves all categories for a specific user",
          "tags": [
            "Categories"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Category"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/categories/{user_id}/{category_name}": {
        "get": {
          "summary": "Get category by name",
          "description": "Retrieves a category by user ID and category name",
          "tags": [
            "Categories"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "user_id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "path",
              "name": "category_name",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Category"
                  }
                }
              }
            }
          }
        }
      },
      "/api/categories/new": {
        "post": {
          "summary": "Create new category",
          "description": "Creates a new category",
          "tags": [
            "Categories"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "category_name": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Category"
                  }
                }
              }
            }
          }
        }
      },
      "/api/categories/delete": {
        "post": {
          "summary": "Delete category",
          "description": "Deletes a category",
          "tags": [
            "Categories"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "category_name": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      },
      "/api/categories/update_name": {
        "post": {
          "summary": "Update category name",
          "description": "Updates a category's name",
          "tags": [
            "Categories"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/x-www-form-urlencoded": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "integer"
                    },
                    "category_name": {
                      "type": "string"
                    },
                    "new_category_name": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful operation"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {
        "User": {
          "type": "object",
          "properties": {
            "user_id": {
              "type": "integer",
              "description": "The unique identifier for the user"
            },
            "user_name": {
              "type": "string",
              "description": "The username of the user",
              "maxLength": 128
            },
            "password": {
              "type": "string",
              "description": "The hashed password for the user",
              "maxLength": 128
            },
            "image_url": {
              "type": "string",
              "description": "The URL of the user's profile image"
            },
            "salt_password": {
              "type": "string",
              "description": "The salt used for password hashing"
            },
            "email": {
              "type": "string",
              "description": "The email address of the user",
              "maxLength": 128
            }
          },
          "required": [
            "user_name",
            "password",
            "email",
            "salt_password"
          ]
        },
        "Note": {
          "type": "object",
          "properties": {
            "note_id": {
              "type": "integer",
              "description": "The unique identifier for the note"
            },
            "user_id": {
              "type": "integer",
              "description": "The user who created the note (foreign key to `users`)"
            },
            "note_name": {
              "type": "string",
              "description": "The name of the note"
            },
            "content": {
              "type": "string",
              "description": "The content of the note"
            },
            "edited_at": {
              "type": "string",
              "format": "date-time",
              "description": "The timestamp when the note was last edited"
            },
            "category": {
              "type": "integer",
              "description": "The category ID where the note belongs (foreign key to `categories`)"
            }
          },
          "required": [
            "user_id",
            "note_name",
            "content"
          ]
        },
        "SharedNote": {
          "type": "object",
          "properties": {
            "shared_id": {
              "type": "integer",
              "description": "The unique identifier for the shared note entry"
            },
            "note_id": {
              "type": "integer",
              "description": "The ID of the note that is shared (foreign key to `notes`)"
            },
            "user_id": {
              "type": "integer",
              "description": "The ID of the user with whom the note is shared (foreign key to `users`)"
            }
          },
          "required": [
            "note_id",
            "user_id"
          ]
        },
        "Category": {
          "type": "object",
          "properties": {
            "category_id": {
              "type": "integer",
              "description": "The unique identifier for the category"
            },
            "category_name": {
              "type": "string",
              "description": "The name of the category",
              "maxLength": 128
            },
            "user_id": {
              "type": "integer",
              "description": "The user who owns the category (foreign key to `users`)"
            }
          },
          "required": [
            "category_name",
            "user_id"
          ]
        }
      }
    }
  },
  apis: ["./src/routes/*.ts"]
}


  export default swaggerOptions;