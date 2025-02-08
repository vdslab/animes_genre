import { Box, CircularProgress, Typography } from "@mui/material";

export const Loading = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100%"
    >
      <Typography variant="h4">Loading...</Typography>
      <CircularProgress />
      <br></br>
      <h3>操作説明</h3>
      <p>このサイトでは、アニメのジャンルと人気度を可視化しました。</p>
      <p>
        ノードが近いとジャンルが類似していて、遠いとジャンルは類似してません。
      </p>
      <p>
        人気度が高いとノードが大きく、人気度が少ないとノードが小さくなっています。
      </p>
      <p>
        上記の「総合を見る」をチェックすると、全体のデータの表示に、チェックを外すと年月別での表示になります。
      </p>
      <p>
        「STOP」ボタンをクリックするとデータの更新が止まり、「START」で再開できます。また、スライダーで年月を変更できます。
      </p>
      <p>「アニメを検索」バーで好きなアニメを検索できます。</p>
      <p>
        マップ上のノードをクリックすると、そのアニメの詳細情報が右に表示されます。
      </p>
    </Box>
  );
};
