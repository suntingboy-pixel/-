
export const registerUser = (username: string, password: string): { success: boolean; message: string } => {
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' };
  }
  
  const usersStr = localStorage.getItem('smartValue_users');
  const users = usersStr ? JSON.parse(usersStr) : {};
  
  if (users[username]) {
    return { success: false, message: '用户名已存在' };
  }
  
  users[username] = password;
  localStorage.setItem('smartValue_users', JSON.stringify(users));
  return { success: true, message: '注册成功' };
};

export const loginUser = (username: string, password: string): { success: boolean; message: string } => {
  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' };
  }

  const usersStr = localStorage.getItem('smartValue_users');
  const users = usersStr ? JSON.parse(usersStr) : {};
  
  if (!users[username]) {
    return { success: false, message: '用户不存在' };
  }
  
  if (users[username] !== password) {
    return { success: false, message: '密码错误' };
  }
  
  return { success: true, message: '登录成功' };
};
