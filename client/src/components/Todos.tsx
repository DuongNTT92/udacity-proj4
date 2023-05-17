import dateFormat from 'dateformat'
import {History} from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import {createTodo, deleteTodo, getTodoByDate, getTodos, patchTodo} from '../api/todos-api'
import Auth from '../auth/Auth'
import {Todo} from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  type: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    type: 'all'
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({newTodoName: event.target.value})
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: {done: {$set: !todo.done}}
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TODOs</Header>
        {this.renderButtonFilterByDate()}
        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider/>
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading();
    }

    return this.renderTodosList();
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil"/>
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete"/>
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped/>
              )}
              <Grid.Column width={16}>
                <Divider/>
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  renderButtonFilterByDate() {
    return (
      <Button.Group style={{marginBottom: '5px'}}>
        <Button onClick={() => this.onButtonClick('all')} style={{marginRight: '2px', backgroundColor: this.state.type === 'all' ? 'beige' : ""}}>All</Button>
        <Button onClick={() => this.onButtonClick('overDue')} style={{marginRight: '2px', backgroundColor: this.state.type === 'overDue' ? 'beige' : ""}}>Overdue</Button>
        <Button onClick={() => this.onButtonClick('today')} style={{marginRight: '2px', backgroundColor: this.state.type === 'today' ? 'beige' : ""}}>Today</Button>
        <Button onClick={() => this.onButtonClick('tomorrow')} style={{ backgroundColor: this.state.type === 'tomorrow' ? 'beige' : ""}}>Tomorrow</Button>
      </Button.Group>
    );
  }

  async onButtonClick(type: string | 'all') {
    let date = '';
    switch (type) {
      case 'overDue':
        date = this.getPreviousDate();
        break;
      case 'today':
        date = this.getCurrentDate();
        break;
      case 'tomorrow':
        date = this.getNextDate();
        break;
      default:
        date = '';
        break;
    }

    this.setState({ type, loadingTodos: true });

    //Component can re-render when state loadingTodo changed
    setTimeout(async () => {
      try {
        let todos;
        if (date === '') {
          todos = await getTodos(this.props.auth.getIdToken());
        } else {
          todos = await getTodoByDate(this.props.auth.getIdToken(), date);
        }

        this.setState({
          todos,
          loadingTodos: false
        });
      } catch (e) {
        alert(`Failed to fetch todos: ${(e as Error).message}`);
        this.setState({ loadingTodos: false });
      }
    }, 300);
  }

  getPreviousDate() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    return this.formatDate(currentDate);
  }

  getCurrentDate() {
    const currentDate = new Date();
    return this.formatDate(currentDate);
  }

  getNextDate() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    return this.formatDate(currentDate);
  }

  formatDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate())

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
