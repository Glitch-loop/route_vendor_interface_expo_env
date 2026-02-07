import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import UserDTO from '@/src/application/dto/UserDTO';

const userSlice = createSlice({
  name: 'user',
  initialState: null as UserDTO | null,
  reducers: {
    setUser: (state, action: PayloadAction<UserDTO>) => {
      return {
        id_vendor: action.payload.id_vendor,
        name:      action.payload.name,
        cellphone: action.payload.cellphone,
        password:  action.payload.password,
        status:    action.payload.status,
      };
    },
    logoutUser: (state, action: PayloadAction<null>) => {
      return null;
    }
  },
});


export const { setUser, logoutUser } = userSlice.actions;

export default userSlice.reducer;
